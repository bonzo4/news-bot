import {
    AutocompleteInteraction,
    Channel,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Events,
    Guild,
    GuildTextBasedChannel,
    Interaction,
    Message,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    RateLimitData,
    RESTEvents,
    Role,
    TextChannel,
    User,
    userMention,
    VoiceChannel,
} from 'discord.js';
import { createRequire } from 'node:module';

import { systemButtons, systemLinks } from '../buttons/system.js';
import { config } from '../config/config.js';
import { debug } from '../config/debug.js';
import { ChannelDeleteHandler } from '../events/channel-delete-handler.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
} from '../events/index.js';
import { MenuHandler } from '../events/menu-handler.js';
import { ModalSubmitHandler } from '../events/modal-submit-handler.js';
import { RoleDeleteHandler } from '../events/role-delete-handler.js';
import { SetupMessages } from '../messages/setup.js';
import { JobService, Logger } from '../services/index.js';
import { NewsDbUtils } from '../utils/database/news-db-utils.js';
import {
    ChannelDbUtils,
    GuildDbUtils,
    GuildSettingsDbUtils,
    InteractionUtils,
    PartialUtils,
    ScheduledNews,
} from '../utils/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

type BotOptions = {
    token: string;
    client: Client;
    guildJoinHandler: GuildJoinHandler;
    guildLeaveHandler: GuildLeaveHandler;
    messageHandler: MessageHandler;
    commandHandler: CommandHandler;
    buttonHandler: ButtonHandler;
    channelDeleteHandler: ChannelDeleteHandler;
    roleDeleteHandler: RoleDeleteHandler;
    menuHandler: MenuHandler;
    modalHandler: ModalSubmitHandler;
    reactionHandler: ReactionHandler;
    jobService: JobService;
};

export class Bot {
    private ready = false;

    constructor(private options: BotOptions) {}

    public async start(): Promise<void> {
        this.registerListeners();
        await this.login(this.options.token);
    }

    private registerListeners(): void {
        this.options.client.on(Events.ClientReady, () => this.onReady());
        this.options.client.on(
            Events.ShardReady,
            (shardId: number, unavailableGuilds: Set<string>) =>
                this.onShardReady(shardId, unavailableGuilds)
        );
        this.options.client.on(Events.GuildCreate, (guild: Guild) => this.onGuildJoin(guild));
        this.options.client.on(Events.GuildDelete, (guild: Guild) => this.onGuildLeave(guild));
        this.options.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg));
        this.options.client.on(Events.ChannelDelete, channel => this.onChannelDelete(channel));
        this.options.client.on(Events.GuildRoleDelete, role => this.onRoleDelete(role));
        this.options.client.on(Events.InteractionCreate, (intr: Interaction) =>
            this.onInteraction(intr)
        );
        this.options.client.on(
            Events.MessageReactionAdd,
            async (
                messageReaction: MessageReaction | PartialMessageReaction,
                user: User | PartialUser
            ) => await this.onReaction(messageReaction, user)
        );
        this.options.client.on(
            'scheduleNews',
            async ({ newsId }: { newsId: number }) => await this.scheduleNews(newsId)
        );
        this.options.client.on(
            'newsSent',
            async ({ newsId, shard }: { newsId: number; shard: number }) => {
                await this.onNewsSent(newsId, shard);
            }
        );
        // this.options.client.on(
        //     'newsReceived',
        //     async ({ newsId, shard }: { newsId: number; shard: number }) => {
        //         await this.onNewsReceived(newsId, shard);
        //     }
        // );
        this.options.client.on(
            'botStats',
            async ({ guildCount, memberCount }: { guildCount: number; memberCount: number }) => {
                await this.broadcastStats(guildCount, memberCount);
                // await this.updateAllGuildInvitesAndAnnouncementChannels();
            }
        );
        this.options.client.on(
            'weeklyUpdate',
            async () => await this.updateAllGuildInvitesAndAnnouncementChannels()
        );
        this.options.client.on(
            'guildBanner',
            async ({ bannerUrl, guildId }: { bannerUrl: string; guildId: string }) => {
                await this.guildBanner(bannerUrl, guildId, this.options.client);
            }
        );
        this.options.client.on(
            'guildReferral',
            async ({ guildId, userId }: { guildId: string; userId: string }) => {
                await this.guildReferral(guildId, userId, this.options.client);
            }
        );
        this.options.client.on(
            'userReferral',
            async ({ referrerId, userId }: { referrerId: string; userId: string }) => {
                await this.userReferral(referrerId, userId, this.options.client);
            }
        );
        this.options.client.on('changeTopic', async ({ topic }: { topic: string }) => {
            await this.onChangeTopic({ topic });
        });
        this.options.client.rest.on(
            RESTEvents.RateLimited,
            async (rateLimitData: RateLimitData) => await this.onRateLimit(rateLimitData)
        );
    }

    private async login(token: string): Promise<void> {
        try {
            await this.options.client.login(token);
        } catch (error) {
            await Logger.error({
                message: Logs.error.clientLogin,
                obj: error,
            });
            return;
        }
    }

    private async onReady(): Promise<void> {
        try {
            let userTag = this.options.client.user?.tag;

            if (!debug.dummyMode.enabled) {
                this.options.jobService.start();
            }

            this.ready = true;
            Logger.info({
                message: Logs.info.clientLogin.replaceAll('{USER_TAG}', userTag),
            });
            await this.getNews();
        } catch (error) {
            await Logger.error({
                message: `An error occurred while starting the bot.\n${error}`,
                obj: error,
            });
        }
    }

    private async updateAllGuildInvitesAndAnnouncementChannels(): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        this.options.client.guilds.cache.map(async guild => {
            try {
                const guildDoc = await GuildDbUtils.getGuildById(guild.id);
                if (!guildDoc) return;
                // scrape invites and announcement channels
                await GuildDbUtils.createGuild(guild);
                // await this.updateSystemMessage(guild);
            } catch (error) {
                await Logger.error({
                    message: `An error occurred while updating a guild.\n${error}`,
                    guildId: guild.id,
                });
            }
        });
    }

    private async dailyUpdateAllGuilds(): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        this.options.client.guilds.cache.map(async guild => {
            try {
                const guildDoc = await GuildDbUtils.getGuildById(guild.id);
                if (!guildDoc) return;
                await GuildDbUtils.updateGuild(guild);
                // await this.updateSystemMessage(guild);
            } catch (error) {
                await Logger.error({
                    message: `An error occurred while updating a guild.\n${error}`,
                    guildId: guild.id,
                });
            }
        });
    }

    private async getNews(): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        try {
            const news = await NewsDbUtils.getScheduledNews();
            for (const n of news) {
                await this.scheduleNews(n.id);
            }
        } catch (error) {
            await Logger.error({
                message: `An error occurred while getting news.\n${error}`,
            });
        }
    }

    private async updateSystemMessage(guild: Guild): Promise<void> {
        const guildDoc = await GuildDbUtils.getGuildById(guild.id);
        if (!guildDoc) return;
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(guild.id);
        if (!guildSettings) return;
        const systemChannel = guild.channels.cache.get(guildSettings.system_id) as TextChannel;
        if (!systemChannel) return;
        await systemChannel.bulkDelete(100);
        await systemChannel.send({
            embeds: [SetupMessages.systemMessage()],
            components: [systemLinks(), systemButtons()],
        });
    }

    private onShardReady(shardId: number, _unavailableGuilds: Set<string>): void {
        Logger.setShardId(shardId);
    }

    private async onGuildJoin(guild: Guild): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        try {
            await this.options.guildJoinHandler.process(guild);
        } catch (error) {
            await Logger.error({
                message: Logs.error.guildJoin,
                obj: error,
                guildId: guild.id,
            });
        }
    }

    private async onGuildLeave(guild: Guild): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        try {
            await this.options.guildLeaveHandler.process(guild);
        } catch (error) {
            Logger.info({
                message: Logs.error.guildLeft,
                obj: error,
                guildId: guild.id,
            });
        }
    }

    private async onChannelDelete(channel: Channel): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        try {
            await this.options.channelDeleteHandler.process(channel);
        } catch (error) {
            const id = channel.isDMBased() ? undefined : channel.id;
            await Logger.error({
                message: Logs.error.channelDelete,
                obj: error,
                guildId: id,
            });
        }
    }

    private async onRoleDelete(role: Role): Promise<void> {
        if (!this.ready || debug.dummyMode.enabled) {
            return;
        }
        try {
            await this.options.roleDeleteHandler.process(role);
        } catch (error) {
            await Logger.error({
                message: Logs.error.roleDelete,
                obj: error,
                guildId: role.guild.id,
            });
        }
    }

    private async onMessage(msg: Message): Promise<void> {
        if (
            !this.ready ||
            (debug.dummyMode.enabled && !debug.dummyMode.whitelist.includes(msg.author.id))
        ) {
            return;
        }

        try {
            msg = await PartialUtils.fillMessage(msg);
            if (!msg) {
                return;
            }

            await this.options.messageHandler.process(msg);
        } catch (error) {
            await Logger.error({
                message: Logs.error.message,
                obj: error,
                guildId: msg.guild?.id,
            });
        }
    }

    private async onInteraction(intr: Interaction): Promise<void> {
        if (
            !this.ready ||
            (debug.dummyMode.enabled && !debug.dummyMode.whitelist.includes(intr.user.id))
        ) {
            return;
        }

        if (intr instanceof CommandInteraction || intr instanceof AutocompleteInteraction) {
            try {
                await this.options.commandHandler.process(intr);
            } catch (error) {
                if (intr instanceof CommandInteraction)
                    await InteractionUtils.error(
                        intr,
                        `An error occurred while processing the command. Please try again later.`
                    );
                await Logger.error({
                    message: `Error while processing command: ${error}`,
                    obj: error,
                    guildId: intr.guild?.id,
                    userId: intr.user.id,
                });
            }
        } else if (intr.isButton()) {
            try {
                await this.options.buttonHandler.process(intr);
            } catch (error) {
                await InteractionUtils.error(
                    intr,
                    `An error occurred while processing the button. Please try again later.`
                );
                await Logger.error({
                    message: `Error while processing button: ${error}`,
                    obj: error,
                    guildId: intr.guild?.id,
                    userId: intr.user.id,
                });
            }
        } else if (intr.isModalSubmit()) {
            try {
                await this.options.modalHandler.process(intr);
            } catch (error) {
                await InteractionUtils.error(
                    intr,
                    `An error occurred while processing your submission. Please try again later.`
                );
                await Logger.error({
                    message: `Error while processing modal: ${error}`,
                    obj: error,
                    guildId: intr.guild?.id,
                    userId: intr.user.id,
                });
            }
        } else if (intr.isAnySelectMenu()) {
            try {
                await this.options.menuHandler.process(intr);
            } catch (error) {
                await InteractionUtils.error(
                    intr,
                    `An error occurred while processing your selection. Please try again later.`
                );
                await Logger.error({
                    message: `Error while processing menu: ${error}`,
                    obj: error,
                    guildId: intr.guild?.id,
                    userId: intr.user.id,
                });
            }
        }
    }

    private async onReaction(
        msgReaction: MessageReaction | PartialMessageReaction,
        reactor: User | PartialUser
    ): Promise<void> {
        if (
            !this.ready ||
            (debug.dummyMode.enabled && !debug.dummyMode.whitelist.includes(reactor.id))
        ) {
            return;
        }

        try {
            msgReaction = await PartialUtils.fillReaction(msgReaction);
            if (!msgReaction) {
                return;
            }

            reactor = await PartialUtils.fillUser(reactor);
            if (!reactor) {
                return;
            }

            await this.options.reactionHandler.process(
                msgReaction,
                msgReaction.message as Message,
                reactor
            );
        } catch (error) {
            await Logger.error({
                message: Logs.error.reaction,
                obj: error,
                guildId: msgReaction.message?.guild?.id,
            });
        }
    }

    private async onRateLimit(rateLimitData: RateLimitData): Promise<void> {
        if (rateLimitData.timeToReset >= config.logging.rateLimit.minTimeout * 1000) {
            await Logger.error({
                message: Logs.error.apiRateLimit,
                obj: rateLimitData,
            });
        }
    }

    private async scheduleNews(newsId: number): Promise<void> {
        try {
            const news = await NewsDbUtils.getNews(newsId);
            if (!news) {
                await Logger.error({
                    message: `Failed to schedule news ${newsId}: news not found`,
                });
                return;
            }
            if (!news.approved) {
                await Logger.error({
                    message: `Failed to schedule news ${newsId}: news not approved`,
                });
                return;
            }
            if (new Date(news.schedule) < new Date()) {
                await Logger.error({
                    message: `Failed to schedule news ${newsId}: schedule is in the past`,
                });
                return;
            }
            Logger.info({ message: `Scheduling news ${newsId} for ${news.schedule}` });
            new ScheduledNews({
                newsId: newsId,
                schedule: new Date(news.schedule),
                client: this.options.client,
            }).start();
        } catch (error) {
            await Logger.error({
                message: `Failed to schedule news ${newsId}`,
                obj: error,
            });
        }
    }

    // private async onNewsReceived(newsId: number, shard: number): Promise<void> {
    //     try {
    //         const syndicateGuild = this.options.client.guilds.cache.get(config.syndicateGuildId);
    //         if (!syndicateGuild) return;
    //         const news = await NewsDbUtils.getNews(newsId);
    //         if (!news) {
    //             return;
    //         }
    //         const adminChannel = syndicateGuild.channels.cache.get(
    //             '988242915027460146'
    //         ) as TextChannel;
    //         if (!adminChannel) {
    //             return;
    //         }
    //         await adminChannel.send(`Shard (${shard + 1}/${6}) starting news send ${newsId}`);
    //     } catch (error) {
    //         await Logger.error({
    //             message: `Failed to send news received notification for news ${newsId}`,
    //             obj: error,
    //         });
    //     }
    // }

    private async onNewsSent(newsId: number, shard: number): Promise<void> {
        try {
            const syndicateGuild = this.options.client.guilds.cache.get(config.syndicateGuildId);
            if (!syndicateGuild) return;
            const news = await NewsDbUtils.getNews(newsId);
            if (!news) {
                return;
            }
            const adminChannel = syndicateGuild.channels.cache.get(
                '988242915027460146'
            ) as TextChannel;
            if (!adminChannel) {
                return;
            }
            await adminChannel.send(
                `Shard (${shard + 1}/${9}) finished sending news ${newsId}, now restarting...`
            );
        } catch (error) {
            await Logger.error({
                message: `Failed to send news sent notification for news ${newsId}`,
                obj: error,
            });
        }
    }

    private async broadcastStats(guildCount: number, memberCount: number): Promise<void> {
        try {
            const syndicateGuild = this.options.client.guilds.cache.get(config.syndicateGuildId);
            if (!syndicateGuild) return;
            const guildCountChannel = syndicateGuild.channels.cache.get(
                config.syndicateChannels.guildCount
            ) as VoiceChannel;
            const memberCountChannel = syndicateGuild.channels.cache.get(
                config.syndicateChannels.memberCount
            ) as VoiceChannel;

            const memberCountString =
                memberCount >= 1000000
                    ? `${Math.floor((memberCount / 1000000) * 10) / 10}M+`
                    : `${memberCount}`;

            await guildCountChannel.setName(`In: ${guildCount} Communities`);
            await memberCountChannel.setName(`Reach: ${memberCountString} Members`);
        } catch (error) {
            await Logger.error({
                message: `Failed to broadcast stats`,
                obj: error,
            });
        }
    }

    private async guildBanner(bannerUrl: string, guildId: string, client: Client): Promise<void> {
        const syndicateGuild = client.guilds.cache.get(config.syndicateGuildId);
        if (!syndicateGuild) return;
        const guildJoinChannel = syndicateGuild.channels.cache.get(
            config.syndicateChannels.guildJoined
        ) as GuildTextBasedChannel;
        const guildDoc = await GuildDbUtils.getGuildById(guildId);
        const embed = new EmbedBuilder()
            .setTitle(`Welcome to the Syndicate Network`)
            .setImage(bannerUrl)
            .setFooter({
                text: 'Syndicate Network',
                iconURL: config.syndicateIcon,
            });
        if (guildDoc.invite) embed.setURL(guildDoc.invite);

        await guildJoinChannel.send({ embeds: [embed] });
    }

    private async guildReferral(guildId: string, userId: string, client: Client): Promise<void> {
        const syndicateGuild = client.guilds.cache.get(config.syndicateGuildId);
        if (!syndicateGuild) return;
        const guildReferralChannel = syndicateGuild.channels.cache.get(
            config.syndicateChannels.guildJoined
        ) as GuildTextBasedChannel;

        const guild = await client.guilds.fetch(guildId);
        const user = await client.users.fetch(userId);

        const guildDoc = await GuildDbUtils.getGuildById(guild.id);

        const embed = new EmbedBuilder()
            .setTitle(`Guild Referral`)
            .setImage(guildDoc.banner)
            .setAuthor({
                name: user.tag,
                iconURL: user.avatarURL() ?? undefined,
            })
            .setDescription(`Referred by ${userMention(user.id)}`)
            .setFooter({
                text: 'Syndicate Network',
                iconURL: config.syndicateIcon,
            })
            .setTimestamp();

        if (guildDoc.invite) embed.setURL(guildDoc.invite);

        await guildReferralChannel.send({ embeds: [embed] });
    }

    private async userReferral(referrerId: string, userId: string, client: Client): Promise<void> {
        const syndicateGuild = client.guilds.cache.get(config.syndicateGuildId);
        if (!syndicateGuild) return;
        const userReferralChannel = syndicateGuild.channels.cache.get(
            config.syndicateChannels.ambassadorJoined
        ) as GuildTextBasedChannel;

        const referrer = await client.users.fetch(referrerId);
        const user = await client.users.fetch(userId);

        const embed = new EmbedBuilder()
            .setTitle(`Ambassador Referral: ${user.tag}`)
            .setAuthor({
                name: referrer.tag,
                iconURL: referrer.avatarURL() ?? undefined,
            })
            .setThumbnail(user.avatarURL() ?? undefined)
            .setDescription(
                `Thank you for joining the Syndicate Network.\n\nReferred by ${userMention(
                    referrer.id
                )}.`
            )
            .setFooter({
                text: 'Syndicate Network',
                iconURL: config.syndicateIcon,
            })
            .setTimestamp();

        await userReferralChannel.send({ embeds: [embed] });
    }

    private async onChangeTopic({ topic }: { topic: string }): Promise<void> {
        const guildIds = Array.from(this.options.client.guilds.cache.keys());
        for (const guildId of guildIds) {
            try {
                const guild = this.options.client.guilds.cache.get(guildId);
                if (!guild) continue;
                const guildSettings = await GuildSettingsDbUtils.getGuildSettings(guildId);
                if (!guildSettings) continue;
                const channels = await ChannelDbUtils.getAllNewsChannelsByGuild(guildSettings);
                for (const { id } of channels) {
                    const channel = guild.channels.cache.get(id);
                    if (!channel) continue;
                    await channel.edit({ topic }).catch(async error => {
                        await Logger.error({
                            message: 'Error changing topic',
                            obj: error,
                            guildId: guildId,
                        });
                    });
                }
            } catch (err) {
                await Logger.error({
                    message: `Error changing topic news to guild: ${err}`,
                    guildId,
                }).catch(async err => {
                    await Logger.error({
                        message: `Error logging error: ${err}`,
                    });
                });
            }
        }
    }
}
