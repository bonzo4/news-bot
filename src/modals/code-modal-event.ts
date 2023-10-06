import {
    ActionRowBuilder,
    Client,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { EventData } from '../models/internal-models.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { UserReferralDbUtils } from '../utils/database/user-referrals-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export function codeModal(): ModalBuilder {
    const modal = new ModalBuilder().setTitle('Syndicate News').setCustomId(`code`);

    const referrer = new TextInputBuilder()
        .setCustomId('referrer')
        .setLabel('Did someone recruit you?(optional)')
        .setPlaceholder('Enter recruitment code')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const referral = new TextInputBuilder()
        .setCustomId('code')
        .setLabel('Enter custom referral code')
        .setPlaceholder('Enter referral code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const referrerRow = new ActionRowBuilder<TextInputBuilder>().addComponents([referrer]);

    const referralRow = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([referrerRow, referralRow]);

    return modal;
}

export class CodeModal implements ModalSubmit {
    ids: string[] = ['code'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const referrerCode = intr.fields.getTextInputValue('referrer');
        const code = intr.fields.getTextInputValue('code');

        if (!code) {
            await InteractionUtils.warn(intr, 'Please enter a valid code.');
            return;
        }

        let referralCode = await AmbassadorCodeDbUtils.getCodeByDiscordId(data.userData.id);

        if (referralCode) {
            await InteractionUtils.warn(intr, 'You already have a referral code set.');
            return;
        }

        referralCode = await AmbassadorCodeDbUtils.getCodeByCode(code);

        if (referralCode) {
            await InteractionUtils.warn(intr, 'That referral code is already in use.');
            return;
        }

        if (referrerCode && referrerCode !== code && referrerCode !== '') {
            const referrer = await AmbassadorCodeDbUtils.getCodeByCode(referrerCode);
            if (!referrer) {
                await InteractionUtils.warn(intr, 'That recruitment code is invalid.');
                return;
            }
            await UserReferralDbUtils.createReferral(data.userData.id, referrer.discord_id);
            await broadcastUserReferral(intr.client, {
                referrerId: referralCode.discord_id,
                userId: data.userData.id,
            });
        }

        await AmbassadorCodeDbUtils.createCode(data.userData.id, code);

        await InteractionUtils.success(intr, 'Thank you for becoming a Syndicate Ambassador!');
    }
}

export async function broadcastUserReferral(
    client: Client,
    { referrerId, userId }: { referrerId: string; userId: string }
): Promise<void> {
    client.emit('userReferral', { referrerId, userId });
}
