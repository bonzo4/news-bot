import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { tagMenu } from './tag-menu-event.js';
import { approveNewsButtons } from '../buttons/approve-button-event.js';
import { EventData } from '../models/internal-models.js';
import { ComponentUtils } from '../utils/components-utils.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { NewsDbUtils } from '../utils/database/news-db-utils.js';
import { EmbedUtils } from '../utils/embed-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { NewsUtils } from '../utils/news-utils.js';
import { Content } from '../utils/schedule-utils.js';

export async function approveNewsMenu(): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const news = await NewsDbUtils.getUnapprovedNews();
    const row = new ActionRowBuilder<StringSelectMenuBuilder>();
    const menu = new StringSelectMenuBuilder()
        .setCustomId(`approveNews`)
        .setPlaceholder('Select a news')
        .addOptions(
            news.map(n => {
                return {
                    label: n.title,
                    value: n.id.toString(),
                };
            })
        );
    row.addComponents([menu]);
    return row;
}

export class ApproveNewsMenu implements Menu {
    ids = ['approveNews'];
    cooldown = new RateLimiter(1, 5000);
    deferType = MenuDeferType.REPLY;

    async execute(intr: StringSelectMenuInteraction, data: EventData): Promise<void> {
        if (data.userData.staff_role !== 'ADMIN') {
            await InteractionUtils.warn(intr, 'You do not have permission to use this command.');
            return;
        }
        const newsId = parseInt(intr.values[0]);
        if (!newsId) {
            await InteractionUtils.warn(intr, 'Please select a valid news document.');
            return;
        }
        const news = await NewsDbUtils.getNews(newsId);

        if (!news) {
            await InteractionUtils.warn(intr, 'News document not found.');
            return;
        }

        if (news.approved) {
            await InteractionUtils.warn(intr, 'News document already approved.');
            return;
        }

        const channel = await intr.user.createDM();
        const embeds = await EmbedDbUtils.getEmbedsByNewsId(news.id);
        if (!embeds.length) {
            await InteractionUtils.warn(intr, 'News document has no embeds.');
            return;
        }

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
            tags: [],
            channel,
            content: contentToSend,
        });

        await channel.send({
            components: [await tagMenu(newsId), approveNewsButtons(newsId)],
        });

        await InteractionUtils.success(intr, 'News sent to user.');
    }
}
