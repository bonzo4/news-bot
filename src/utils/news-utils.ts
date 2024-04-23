import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    DMChannel,
    EmbedBuilder,
    Guild,
    GuildTextBasedChannel,
    Message,
    MessageCreateOptions,
    TextBasedChannel,
} from 'discord.js';

import { ChannelDbUtils } from './database/channel-db-utils.js';
import { Direct, DirectDbUtils } from './database/direct-db-utils.js';
import { EmbedDoc } from './database/embed-db-utils.js';
import { GuildSettings, GuildSettingsDbUtils } from './database/guild-settings-db-utils.js';
import { Input, InputDbUtils } from './database/input-db-utils.js';
import { Link, LinkDbUtils } from './database/link-db-utils.js';
import { MentionDbUtils } from './database/mention-db-utils.js';
import { Poll, PollDbUtils } from './database/poll-db-utils.js';
import { ProfileButtonDbUtils } from './database/profile-button-db-utils.js';
import { Promo, PromoDbUtils } from './database/promo-db-utils.js';
import { Quiz, QuizDbUtils } from './database/quiz-db-utils.js';
import { WalletButtonDbUtils } from './database/wallet-button-db-utils.js';
import { Logger } from '../services/logger.js';

export type InteractionType = Poll | Quiz | Input | Link | Direct | Promo;

export type SendContent = {
    embed: any;
    components: ActionRowBuilder<ButtonBuilder>[];
    tag: string | null;
    reactions: string[] | null;
}[];

type SendOptions = {
    tags: string[];
    content: SendContent;
};

type GuildSendOptions = {
    hasMention: boolean;
    hasThread: boolean;
    mention?: string;
    channel: GuildTextBasedChannel;
} & SendOptions;

type UserSendOptions = {
    channel: DMChannel;
} & SendOptions;

type SendContentOptions = {
    content: MessageCreateOptions;
    channel: GuildTextBasedChannel | DMChannel;
};

export class NewsUtils {
    public static async getNewsChannels(
        guildId: string,
        client: Client
    ): Promise<TextBasedChannel[]> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(guildId);
        if (!guildSettings) {
            await Logger.error({
                message: `Guild not set up for receiving news.`,
                guildId,
            });
            return [];
        }
        const channels = await ChannelDbUtils.getAllNewsChannelsByGuild(guildSettings);
        return channels
            .map(channel => client.channels.cache.get(channel.id))
            .filter(channel => channel.isTextBased()) as TextBasedChannel[];
    }

    public static async sendToGuild(options: GuildSendOptions): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // let sentFirstEmbed = false;
        const { channel, content, mention, hasMention, hasThread, tags } = options;

        await this.sendContent({
            content: {
                embeds: [new EmbedBuilder().setTitle('Syndicate')],
            },
            channel,
        }).then(async message => {
            await message.delete().catch(() => null);
        });

        if (hasMention && mention && mention !== '' && mention !== ' ') {
            await this.sendContent({
                content: {
                    content: mention,
                },
                channel,
            });
        }
        let topMessage: Message;
        for (let index = 0; index < content.length; index++) {
            const { embed, components, tag, reactions } = content[index];
            if (!tag || tag === 'all' || tag === 'guild' || tags.includes(tag)) {
                const message = await this.sendContent({
                    content: {
                        embeds: [embed],
                        components,
                    },
                    channel,
                });

                if (message && reactions) {
                    for (const reaction of reactions) {
                        await message.react(reaction).catch(() => null);
                    }
                }

                if (index === content.length - 1) topMessage = message;
                if (hasThread)
                    await message
                        .startThread({
                            name: 'Syndicate Network Discussion',
                        })
                        .catch(() => null);
            }
        }
        if (tags.includes('news'))
            await this.sendContent({
                content: {
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setURL(topMessage.url)
                                .setEmoji('⬆')
                                .setLabel('To the Top')
                        ),
                    ],
                },
                channel,
            });
    }

    public static async sendToUser(options: UserSendOptions): Promise<void> {
        const { channel, content, tags } = options;
        for (const { embed, components, tag } of content) {
            if (!tag || tag === 'all' || tag === 'direct' || tags.includes(tag)) {
                await this.sendContent({
                    content: {
                        embeds: [embed],
                        components,
                    },
                    channel,
                });
            }
        }
    }

    private static async sendContent(options: SendContentOptions): Promise<Message> {
        const { content, channel } = options;
        let resendError: any = null;
        let message: Message<boolean>;
        await channel
            .send(content)
            .then((msg: Message<boolean>) => {
                message = msg;
            })
            .catch(async error => {
                if (error.code !== 429) throw new Error(error.message ? error.message : error);
                resendError = error;
            });
        while (!message && resendError && resendError.code === 429) {
            await new Promise(resolve => setTimeout(resolve, resendError.retry_after));
            await channel
                .send(content)
                .then((msg: Message<boolean>) => {
                    message = msg;
                })
                .catch(async error => {
                    if (error.code !== 429) throw new Error(error.message ? error.message : error);
                    resendError = error;
                });
        }

        return message;
    }

    public static async getInteractions(embeds: EmbedDoc): Promise<InteractionType[]> {
        const interactions = [];

        for (const interactionType of embeds.interaction_types) {
            let interactionDocs;

            switch (interactionType) {
                case 'POLL':
                    interactionDocs = await PollDbUtils.getPollsByEmbedId(embeds.id);
                    break;
                case 'QUIZ':
                    interactionDocs = await QuizDbUtils.getQuizzesByEmbedId(embeds.id);
                    break;
                case 'INPUT':
                    interactionDocs = await InputDbUtils.getInputsByEmbedId(embeds.id);
                    break;
                case 'LINK':
                    interactionDocs = await LinkDbUtils.getLinksByEmbedId(embeds.id);
                    break;
                case 'DIRECT':
                    interactionDocs = await DirectDbUtils.getDirectsByEmbedId(embeds.id);
                    break;
                case 'PROMO':
                    interactionDocs = await PromoDbUtils.getPromosByEmbedId(embeds.id);
                    break;
                case 'PROFILE':
                    interactionDocs = await ProfileButtonDbUtils.getProfileButtonsByEmbedId(
                        embeds.id
                    );
                    break;
                case 'WALLET':
                    interactionDocs = await WalletButtonDbUtils.getWalletButtonsByEmbedId(
                        embeds.id
                    );
                    break;
                default:
                    interactionDocs = [];
                    break;
            }

            interactions.push(...interactionDocs);
        }

        interactions.sort((a, b) => a.order - b.order);
        return interactions;
    }

    public static async getMention(guildSettings: GuildSettings, guild: Guild): Promise<string> {
        const mentions = await MentionDbUtils.getAllMentionRolesByGuild(guildSettings);
        const mentionString = mentions
            .map(mention => {
                const role = guild.roles.cache.get(mention.id);
                if (!role) return '';
                return role.toString();
            })
            .join(' ');
        return mentionString;
    }
}
