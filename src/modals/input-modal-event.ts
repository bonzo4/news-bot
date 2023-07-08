import {
    ActionRowBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { EventData } from '../models/internal-models.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { Input, InputDbUtils } from '../utils/database/input-db-utils.js';
import { InteractionDbUtils } from '../utils/database/interaction-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function inputModal(input: Input): ModalBuilder {
    const modal = new ModalBuilder().setTitle('Syndicate News').setCustomId(`input_${input.id}`);

    const referral = new TextInputBuilder()
        .setCustomId('input')
        .setLabel(input.question)
        .setPlaceholder('Enter input')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([row]);

    return modal;
}

export class InputModal implements ModalSubmit {
    ids: string[] = ['input'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const inputId = parseInt(intr.customId.split('_')[1]);

        const inputDoc = await InputDbUtils.getInputById(inputId);

        if (!inputDoc) {
            await InteractionUtils.warn(intr, 'Invalid input, sorry!');
            return;
        }

        const input = intr.fields.getTextInputValue('input');

        if (!input) {
            await InteractionUtils.warn(intr, 'Please enter a valid input.');
            return;
        }

        const interaction = await InteractionDbUtils.getInteractionByUserIdAndInputId(
            data.userData.id,
            inputId
        );

        if (interaction) {
            await InteractionUtils.warn(
                intr,
                `You have already submitted an input: ${interaction.input}.`
            );
            return;
        }

        const embed = await EmbedDbUtils.getEmbedById(inputDoc.embed_id);

        await InteractionDbUtils.createInteraction({
            news_id: embed.news_id,
            user_id: data.userData.id,
            guild_id: intr.guildId,
            input_id: inputId,
            input,
        });

        await InteractionUtils.success(intr, 'Input submitted successfully!');
    }
}
