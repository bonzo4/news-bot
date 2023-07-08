import { DMChannel, GuildTextBasedChannel } from 'discord.js';

import { ComponentUtils } from './components-utils.js';
import { EmbedDbUtils } from './database/embed-db-utils.js';
import { NewsDbUtils } from './database/news-db-utils.js';
import { TagDbUtils } from './database/tags-db.utils.js';
import { EmbedUtils } from './embed-utils.js';
import { NewsUtils } from './news-utils.js';
import { Content } from './schedule-utils.js';

export class NewsChannelsUtils {
    public static async sendLastThreeForGuild(channel: GuildTextBasedChannel): Promise<void> {
        const tags = await TagDbUtils.getAllGuildTags(channel.guildId);

        const lastThreeNews = await NewsDbUtils.getLastThreeGuildApprovedNews(tags[0] || null);

        for (const news of lastThreeNews) {
            const embeds = await EmbedDbUtils.getEmbedsByNewsId(news.id);
            if (!embeds.length) continue;

            const content: Content = [];

            for (const embed of embeds) {
                const interactions = await NewsUtils.getInteractions(embed);
                content.push({ embed, interactions });
            }

            const contentToSend = [];

            for (const { embed, interactions } of content) {
                const guildEmbed = await EmbedUtils.formatEmbedForGuild({
                    embed,
                    guildId: channel.guild.id,
                });
                const components = await ComponentUtils.getComponentsForGuilds({
                    guildId: channel.guild.id,
                    embed,
                    interactions,
                });
                contentToSend.push({
                    embed: guildEmbed,
                    components,
                });
            }

            await NewsUtils.sendToGuild({
                channel,
                mention: ' ',
                content: contentToSend,
            });
        }
    }

    public static async sendLastThreeForDirect(channel: DMChannel): Promise<void> {
        const lastThreeNews = await NewsDbUtils.getLastThreeDirectApprovedNews();

        for (const news of lastThreeNews) {
            const embeds = await EmbedDbUtils.getEmbedsByNewsId(news.id);
            if (!embeds.length) continue;

            const content: Content = [];

            for (const embed of embeds) {
                const interactions = await NewsUtils.getInteractions(embed);
                content.push({ embed, interactions });
            }

            const contentToSend = [];

            for (const { embed, interactions } of content) {
                const formattedEmbed = await EmbedUtils.formatEmbedForDirect({
                    embed,
                    userId: channel.recipient.id,
                });

                const components = await ComponentUtils.getComponentsForDirect({
                    interactions,
                    embed,
                    userId: channel.recipient.id,
                });

                contentToSend.push({
                    embed: formattedEmbed,
                    components,
                });
            }

            await NewsUtils.sendToUser({
                channel,
                content: contentToSend,
            });
        }
    }
}
