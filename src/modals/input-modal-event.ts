import {
    ActionRowBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { profileButtons } from '../buttons/profile-button-event.js';
import { EventData } from '../models/internal-models.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import { Input, InputDbUtils } from '../utils/database/input-db-utils.js';
import { InputInteractionDbUtils } from '../utils/database/input-interaction-db-utils.js';
import { PointsDbUtils } from '../utils/database/points-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function inputModal(input: Input): ModalBuilder {
    const modal = new ModalBuilder().setTitle('Syndicate News').setCustomId(`input_${input.id}`);

    const referral = new TextInputBuilder()
        .setCustomId('input')
        .setLabel(input.question)
        .setPlaceholder('Enter input')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(3);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([row]);

    return modal;
}

export class InputModal implements ModalSubmit {
    ids: string[] = ['input'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const userData = data.userData;

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

        const inputInteractions = await InputInteractionDbUtils.getInteractionsByUserIdAndInputId(
            userData.id,
            inputId
        );

        const inputs = inputInteractions.filter(interaction => interaction.input);

        if (inputs.length > 0) {
            const embeds = intr.message.embeds;
            await intr.reply({
                content: `⚠┃You have already submitted an input: ${inputs[0].input}.`,
                embeds,
                ephemeral: true,
            });
            await InputInteractionDbUtils.createInteraction({
                user_id: userData.id,
                news_id: inputInteractions[0].news_id,
                guild_id: intr.guildId,
                input_id: inputId,
            });
            return;
        }

        const embed = await EmbedDbUtils.getEmbedById(inputDoc.embed_id);

        const inputInteractionDoc = await InputInteractionDbUtils.createInteraction({
            user_id: userData.id,
            news_id: embed.news_id,
            guild_id: intr.guildId,
            input_id: inputId,
            input,
        });

        const points = await PointsDbUtils.giveInputPoints(inputInteractionDoc);

        let messageBody = `Input submitted successfully!`;

        if (points > 0) {
            messageBody += `\n\n🏆┃You have received **${points}** points for your input.`;
        }

        await InteractionUtils.success(intr, messageBody, [profileButtons()]);
    }
}
