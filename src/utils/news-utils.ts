import {
    ActionRowBuilder,
    ButtonBuilder,
    Client,
    DMChannel,
    Guild,
    GuildTextBasedChannel,
    roleMention,
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
}[];

type SendOptions = {
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
        const { channel, content, mention } = options;
        for (let index = 0; index < content.length; index++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { embed, components } = content[index];
            if (index === 0) {
                await channel.send({
                    content: mention || ' ',
                    embeds: [embed],
                    components,
                });
                continue;
            }
            await channel.send({
                embeds: [embed],
                components,
            });
        }
    }

    public static async sendToUser(options: UserSendOptions): Promise<void> {
        const { channel, content } = options;
        for (const { embed, components } of content) {
            await channel.send({
                embeds: [embed],
                components,
            });
            await new Promise(resolve => setTimeout(resolve, 500));
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
                if (!role) return ' ';
                if (!role.mentionable) return ' ';
                if (role === guild.roles.everyone) return '@everyone';
                return roleMention(mention.id);
            })
            .join(' ');
        return mentionString;
    }
}
