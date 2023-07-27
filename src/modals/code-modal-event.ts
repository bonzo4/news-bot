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
import { UserDbUtils } from '../utils/database/user-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export function codeModal(trial: boolean): ModalBuilder {
    const modal = new ModalBuilder().setTitle('Syndicate News').setCustomId(`code_${trial}`);

    const referral = new TextInputBuilder()
        .setCustomId('code')
        .setLabel('Enter custom referral code')
        .setPlaceholder('Enter referral code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([row]);

    return modal;
}

export class CodeModal implements ModalSubmit {
    ids: string[] = ['code'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const code = intr.fields.getTextInputValue('code');

        if (!code) {
            await InteractionUtils.warn(intr, 'Please enter a valid code.');
            return;
        }

        if (data.userData.referral_code) {
            await InteractionUtils.warn(intr, 'You already have a referral code set.');
            return;
        }

        const user = await UserDbUtils.getUserByReferralCode(code);
        if (user) {
            await InteractionUtils.warn(intr, 'That referral code is already in use.');
            return;
        }

        const trial = intr.customId.split('_')[1] === 'true';

        await UserDbUtils.updateUser(data.userData.id, {
            referral_code: code,
            user_role: 'STAFF',
            staff_role: trial ? 'TRIAL' : 'AMBASSADOR',
        });

        await InteractionUtils.success(intr, 'Thank you for becoming a Syndicate Ambassador!');
    }
}
