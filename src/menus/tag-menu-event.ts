import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { EventData } from '../models/internal-models.js';
import { NewsDbUtils } from '../utils/database/news-db-utils.js';
import { TagDbUtils } from '../utils/database/tags-db.utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export async function tagMenu(newsId: number): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const tags = await TagDbUtils.getTagsByNewsId(newsId);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tag-menu')
            .setPlaceholder('Select a tag')
            .addOptions(
                tags.map(t => {
                    return {
                        label: t.name,
                        value: t.name,
                    };
                })
            )
    );

    return row;
}

export class TagMenu implements Menu {
    ids = ['tag'];
    deferType: MenuDeferType = MenuDeferType.REPLY;
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: StringSelectMenuInteraction, data: EventData): Promise<void> {
        if (data.staffRole?.staff_role !== 'ADMIN') {
            await InteractionUtils.warn(intr, 'You do not have permission to use this command.');
            return;
        }

        const tag = intr.values[0];

        if (!tag) {
            await intr.reply({ content: 'Please select a valid tag.', ephemeral: true });
            return;
        }

        const newsId = parseInt(intr.customId.split('-')[1]);

        if (!newsId) {
            await intr.reply({ content: 'Please select a valid news.', ephemeral: true });
            return;
        }

        const news = await NewsDbUtils.getNews(newsId);

        await TagDbUtils.addNewsTag(newsId, tag, news.schedule);

        await InteractionUtils.success(intr, `Tag ${tag} added to news ${newsId}.`);
    }
}
