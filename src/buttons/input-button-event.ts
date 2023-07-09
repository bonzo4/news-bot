import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { inputModal } from '../modals/input-modal-event.js';
import { Logger } from '../services/logger.js';
import { InputDbUtils } from '../utils/database/input-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export function inputButton(inputId: number): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`input_${inputId}`)
            .setLabel('Enter')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')
    );
}

export class InputButtons implements Button {
    ids: string[] = ['input'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            const inputId = parseInt(intr.customId.split('_')[1]);
            const input = await InputDbUtils.getInputById(inputId);
            if (!input) {
                await InteractionUtils.send(intr, 'Invalid input button, sorry!');
                return;
            }
            const modal = inputModal(input);
            await intr.showModal(modal);
        } catch (error) {
            await InteractionUtils.error(
                intr,
                `There was an error using this input. Please contact a staff member or try again later.`
            );
            await Logger.error({
                message: `Error using input: ${error.message ? error.message : error}`,
                guildId: intr.guild ? intr.guild.id : null,
                userId: intr.user.id,
            });
        }
    }
}
