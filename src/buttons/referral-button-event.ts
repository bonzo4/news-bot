import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { referralModal } from '../modals/referral-modal-event.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export function setupReferralButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupReferral')
            .setLabel('Submit')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📄'),
    ]);
}

export class SetupReferralButtons implements Button {
    ids: string[] = ['setupReferral'];
    deferType = ButtonDeferType.NONE;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            // 2. else fetch the referral
            const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guildId);

            // 3. if they have already set up a referral for this server, skip the referral setup
            if (referral.discord_user_id) {
                await InteractionUtils.warn(
                    intr,
                    `You have already set up a referral for this server.`
                );
                return;
            }

            // 4. else, send the referral modal
            await intr.showModal(referralModal(false));
        } catch (error) {
            await InteractionUtils.warn(intr, `Something went wrong. Please contact support.`);
        }
    }
}
