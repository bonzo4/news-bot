import {
    ActionRowBuilder,
    ButtonBuilder,
    Client,
    DMChannel,
    Guild,
    GuildTextBasedChannel,
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
import { Promo, PromoDbUtils } from './database/promo-db-utils.js';
import { Quiz, QuizDbUtils } from './database/quiz-db-utils.js';
import { Logger } from '../services/logger.js';

export type InteractionType = Poll | Quiz | Input | Link | Direct | Promo;

export type SendContent = {
    embed: any;
    components: ActionRowBuilder<ButtonBuilder>[];
    tag: string | null;
}[];

type SendOptions = {
    tags: string[];
    content: SendContent;
};

type GuildSendOptions = {
    mention?: string;
    channel: GuildTextBasedChannel;
} & SendOptions;

type UserSendOptions = {
    channel: DMChannel;
} & SendOptions;

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
        let resendError: any = null;
        // let sentFirstEmbed = false;
        const { channel, content, mention, tags } = options;
        if (mention && mention !== '') await channel.send({
            content: mention
        })
        for (let index = 0; index < content.length; index++) {
            const { embed, components, tag } = content[index];
            // if (!sentFirstEmbed) {
            //     if (!tag || tag === 'all' || tag === 'guild' || tags.includes(tag)) {
            //         await channel
            //             .send({
            //                 embeds: [embed],
            //                 components,
            //             })
            //             .then(async (message) => {
            //                 await message.startThread({
            //                     name: ''
            //                 }).catch(() => null)
            //             })
            //             .catch(async error => {
            //                 resendError = error;
            //             });
            //     }
                     
            //     while (resendError && resendError.code === 429) {
            //         await new Promise(resolve => setTimeout(resolve, resendError.retry_after));
            //         await channel
            //             .send({
            //                 embeds: [embed],
            //                 components,
            //             })
            //             .then(async (message) => {
            //                 await message.startThread({
            //                     name: ''
            //                 }).catch(() => null)
            //                 resendError = null;
            //             })
            //             .catch(error => (resendError = error));
            //     }
            //     sentFirstEmbed = true;
            //     continue;
            // }
            if (!tag || tag === 'all' || tag === 'guild' || tags.includes(tag))
                await channel
                    .send({
                        embeds: [embed],
                        components,
                    })
                    .catch(async error => {
                        resendError = error;
                    });
            while (resendError && resendError.code === 429) {
                await new Promise(resolve => setTimeout(resolve, resendError.retry_after));
                await channel
                    .send({
                        embeds: [embed],
                        components,
                    })
                    .then(() => (resendError = null))
                    .catch(error => (resendError = error));
            }
        }
    }

    public static async sendToUser(options: UserSendOptions): Promise<void> {
        const { channel, content, tags } = options;
        for (const { embed, components, tag } of content) {
            let resendError: any;
            if (!tag || tag === 'all' || tag === 'direct' || tags.includes(tag))
                await channel
                    .send({
                        embeds: [embed],
                        components,
                    })
                    .then(() => (resendError = null))
                    .catch(async error => {
                        resendError = error;
                    });
            while (resendError && resendError.code === 429) {
                await new Promise(resolve => setTimeout(resolve, resendError.retry_after));
                await channel
                    .send({
                        embeds: [embed],
                        components,
                    })
                    .then(() => (resendError = null))
                    .catch(error => (resendError = error));
            }
        }
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
