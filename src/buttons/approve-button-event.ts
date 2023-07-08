import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { NewsDbUtils } from '../utils/database/news-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function approveNewsButtons(newsId: number): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(`approve_${newsId}`)
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success),
    ]);
    return row;
}

export class ApproveNewsButtons implements Button {
    ids: string[] = ['approve'];
    deferType = ButtonDeferType.REPLY;

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        if (data.userData.staff_role !== 'ADMIN') {
            await InteractionUtils.warn(intr, 'You do not have permission to use this');
            return;
        }
        const newsId = parseInt(intr.customId.split('_')[1]);
        if (!newsId) {
            await InteractionUtils.warn(intr, 'Please select a valid news document.');
            return;
        }
        const newsDoc = await NewsDbUtils.getNews(newsId);
        if (!newsDoc) {
            await InteractionUtils.warn(intr, 'News document not found.');
            return;
        }
        if (newsDoc.approved) {
            await InteractionUtils.warn(intr, 'News document already approved.');
            return;
        }
        await NewsDbUtils.approveNews(newsId);
        await InteractionUtils.success(intr, `News approved for ${newsDoc.schedule}.`);
    }
}
