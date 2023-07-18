import { CronJob } from 'cron';
import { Client, DMChannel, GuildTextBasedChannel } from 'discord.js';

import { ComponentUtils } from './components-utils.js';
import { ChannelDbUtils } from './database/channel-db-utils.js';
import { EmbedDbUtils, EmbedDoc } from './database/embed-db-utils.js';
import { GuildSettingsDbUtils } from './database/guild-settings-db-utils.js';
import { DiscordNews, NewsDbUtils } from './database/news-db-utils.js';
import { Tag, TagDbUtils } from './database/tags-db.utils.js';
import { EmbedUtils } from './embed-utils.js';
import { InteractionType, NewsUtils, SendContent } from './news-utils.js';
import { Logger } from '../services/logger.js';

type ScheduledNewsOptions = {
    schedule: Date;
    newsId: number;
    client: Client;
};

export type Content = {
    embed: EmbedDoc;
    interactions: InteractionType[];
}[];

type SendOptions = {
    news: DiscordNews;
    content: Content;
};

type GuildSendOptions = {
    guildId: string;
} & SendOptions;

type UserSendOptions = {
    dmChannel: DMChannel;
} & SendOptions;

type SendToTagsOptions = {
    tags: Tag[];
    shardId: number;
} & SendOptions;

export class ScheduledNews extends CronJob {
    private client: Client;

    constructor(options: ScheduledNewsOptions) {
        const { schedule, newsId, client } = options;
        const func = async (): Promise<void> =>
            await this.sendNews(newsId)
                .then(async () => {
                    Logger.info({
                        message: `News sent for id: ${newsId}`,
                        newsId,
                    });
                    const shard = client.guilds.cache.first().shardId;
                    await client.shard.broadcastEval(broadcastNewsSent, {
                        context: { newsId, shard },
                    });
                    this.stop();
                })
                .catch(async error => {
                    await Logger.error({
                        message: `Error sending news: ${error}`,
                        newsId,
                    });
                });
        super(schedule, func, null, false, 'America/Chicago');
        this.client = client;
    }

    private async sendNews(newsId: number): Promise<void> {
        const shardId = this.client.guilds.cache.first()?.shardId;
        // const shard = this.client.guilds.cache.first().shardId;
        // await this.client.shard.broadcastEval(broadcastNewsReceived, {
        //     context: { newsId, shard },
        // });

        const news = await NewsDbUtils.getNews(newsId);
        if (!news) {
            await Logger.error({
                message: `News not found for id: ${newsId}, cancelling send.`,
                newsId,
            });
            return;
        }

        const embeds = await EmbedDbUtils.getEmbedsByNewsId(news.id);
        if (!embeds.length) {
            await Logger.error({
                message: `No embeds found for news id: ${newsId}, cancelling send.`,
                newsId,
            });
            return;
        }

        const content: Content = [];

        for (const embed of embeds) {
            const interactions = await NewsUtils.getInteractions(embed);
            content.push({
                embed,
                interactions,
            });
        }

        const tags = await TagDbUtils.getTagsByNewsId(news.id);

        if (tags.find(tag => tag.name === 'all')) {
            await this.sendToAllGuilds({
                news,
                content,
            });
            if (shardId === 0)
                await this.sendToAllUsers({
                    news,
                    content,
                });
            return;
        }

        if (tags.find(tag => tag.name === 'guild')) {
            await this.sendToAllGuilds({
                news,
                content,
            });
            return;
        }

        if (tags.find(tag => tag.name === 'direct')) {
            if (shardId === 0)
                await this.sendToAllUsers({
                    news,
                    content,
                });
            return;
        }

        await this.sendToTags({
            news,
            content,
            tags,
            shardId,
        });
    }

    private async sendToAllGuilds(options: SendOptions): Promise<void> {
        const { news } = options;
        const guildIds = Array.from(this.client.guilds.cache.keys());
        for (const guildId of guildIds) {
            try {
                await this.sendToGuild({
                    ...options,
                    guildId,
                });
            } catch (err) {
                await Logger.error({
                    message: `Error sending news to guild: ${err}`,
                    guildId,
                    newsId: news.id,
                }).catch(async err => {
                    await Logger.error({
                        message: `Error logging error: ${err}`,
                    });
                });
            }
        }
    }

    private async sendToAllUsers(options: SendOptions): Promise<void> {
        const directChannels = await ChannelDbUtils.getAllDirectNewsChannels();

        for (const directChannel of directChannels) {
            try {
                const dmChannel = (await this.client.channels.fetch(directChannel.id)) as DMChannel;
                await this.sendToUser({
                    ...options,
                    dmChannel,
                });
            } catch (err) {
                await Logger.error({
                    message: `Error sending news to user: ${err}`,
                    userId: directChannel.user_id,
                }).catch(async err => {
                    await Logger.error({
                        message: `Error logging error: ${err}`,
                    });
                });
            }
        }
    }

    private async sendToTags(options: SendToTagsOptions): Promise<void> {
        const { tags, shardId } = options;
        await this.sendToGuildTags({
            ...options,
            tags,
        });
        if (shardId === 0)
            await this.sendToUserTags({
                ...options,
                tags,
            });
    }

    private async sendToGuildTags(options: SendToTagsOptions): Promise<void> {
        const { tags, news } = options;
        const guildIds = Array.from(this.client.guilds.cache.keys());
        const guildsWithTags = await TagDbUtils.getGuildsWithTags(tags, guildIds);
        for (const guildId of guildsWithTags) {
            try {
                await this.sendToGuild({
                    ...options,
                    guildId,
                });
            } catch (err) {
                await Logger.error({
                    message: `Error sending news to guild: ${err}`,
                    guildId,
                    newsId: news.id,
                }).catch(async err => {
                    await Logger.error({
                        message: `Error logging error: ${err}`,
                    });
                });
            }
        }
    }

    private async sendToUserTags(options: SendToTagsOptions): Promise<void> {
        const { tags, news } = options;
        const userWithTags = await TagDbUtils.getUsersWithTags(tags);
        for (const userId of userWithTags) {
            try {
                const directChannel = await ChannelDbUtils.getDirectNewsChannel(userId);
                if (!directChannel) {
                    await Logger.error({
                        message: `No direct channel found for user: ${userId}`,
                        userId,
                        newsId: news.id,
                    });
                    continue;
                }
                const dmChannel = (await this.client.channels.fetch(directChannel.id)) as DMChannel;
                await this.sendToUser({
                    ...options,
                    dmChannel,
                });
            } catch (err) {
                await Logger.error({
                    message: `Error sending news to user: ${err}`,
                    userId,
                    newsId: news.id,
                }).catch(async err => {
                    await Logger.error({
                        message: `Error logging error: ${err}`,
                    });
                });
            }
        }
    }

    private async sendToGuild(options: GuildSendOptions): Promise<void> {
        const { guildId, news, content } = options;
        const settings = await GuildSettingsDbUtils.getGuildSettings(guildId);
        if (!settings) {
            await Logger.error({
                message: `Guild not set up for receiving news.`,
                guildId,
                newsId: news.id,
            });
            return;
        }
        const channels = await ChannelDbUtils.getAllNewsChannelsByGuild(settings);
        if (!channels.length) {
            await Logger.error({
                message: `No news channels found for guild: ${guildId}`,
                guildId,
                newsId: news.id,
            });
            return;
        }
        const guild = this.client.guilds.cache.get(guildId);
        const mention = await NewsUtils.getMention(settings, guild);
        const contentForGuild: SendContent = [];
        for (const { embed, interactions } of content) {
            const guildEmbed = await EmbedUtils.formatEmbedForGuild({
                embed,
                guildId,
            });
            const components = await ComponentUtils.getComponentsForGuilds({
                guildId,
                embed,
                interactions,
            });
            contentForGuild.push({
                embed: guildEmbed,
                components,
            });
        }

        for (const channelDoc of channels) {
            const channel = (await this.client.channels.fetch(
                channelDoc.id
            )) as GuildTextBasedChannel;
            try {
                await NewsUtils.sendToGuild({
                    channel,
                    mention,
                    content: contentForGuild,
                });
            } catch (err) {
                await Logger.error({
                    message: `Error sending news to guild channel: ${err}`,
                    guildId,
                    newsId: news.id,
                });
            }
        }
    }

    private async sendToUser(options: UserSendOptions): Promise<boolean> {
        const { dmChannel, news, content } = options;
        const userId = dmChannel.recipientId;
        const contentForDirect: SendContent = [];
        for (const { embed, interactions } of content) {
            const directEmbed = await EmbedUtils.formatEmbedForDirect({
                embed,
                userId,
            });
            const components = await ComponentUtils.getComponentsForDirect({
                embed,
                interactions,
                userId,
            });
            contentForDirect.push({
                embed: directEmbed,
                components,
            });
        }
        try {
            await NewsUtils.sendToUser({
                channel: dmChannel,
                content: contentForDirect,
            });
        } catch (err) {
            await Logger.error({
                message: `Error sending news to user: ${err}`,
                userId,
                newsId: news.id,
            });
            return false;
        }

        return true;
    }
}

export async function broadcastNewsSent(
    client: Client,
    { newsId, shard }: { newsId: number; shard: number }
): Promise<void> {
    client.emit('newsSent', {
        newsId,
        shard,
    });
}

export async function broadcastNewsReceived(
    client: Client,
    { newsId, shard }: { newsId: number; shard: number }
): Promise<void> {
    client.emit('NewsReceived', {
        newsId,
        shard,
    });
}
