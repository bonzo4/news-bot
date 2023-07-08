import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';

import { Menu, MenuDeferType } from './menu.js';
import { EventData } from '../models/internal-models.js';
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

    async execute(intr: StringSelectMenuInteraction, data: EventData): Promise<void> {
        if (data.userData.staff_role !== 'ADMIN') {
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

        await TagDbUtils.addNewsTag(newsId, tag);

        await InteractionUtils.success(intr, `Tag ${tag} added to news ${newsId}.`);
    }
}
