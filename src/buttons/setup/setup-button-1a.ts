import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { previewButtons } from './setup-button-2.js';
import { SetupMessages } from '../../messages/setup.js';
import { referralModal } from '../../modals/referral-modal-event.js';
import { Logger } from '../../services/logger.js';
import { GuildReferralDbUtils } from '../../utils/database/referral-db-utils.js';
import { InteractionUtils } from '../../utils/index.js';
import { Button, ButtonDeferType } from '../button.js';

export function setupReferralButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupReferralBroken')
            .setLabel('Submit')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📄'),
        new ButtonBuilder()
            .setCustomId('setupReferralBroken_skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌'),
    ]);
}

export class SetupReferralButtons implements Button {
    ids: string[] = ['setupReferralBroken'];
    deferType = ButtonDeferType.NONE;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            // 1. If they press skip, skip the referral setup
            if (intr.customId.split('_')[1] === 'skip') {
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.newsPreview()],
                    components: [previewButtons()],
                });
                await InteractionUtils.success(intr, 'Setup complete');
                return;
            }

            // 2. else fetch the referral
            const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guildId);

            // 3. if they have already set up a referral for this server, skip the referral setup
            if (referral.discord_user_id) {
                await InteractionUtils.warn(
                    intr,
                    `You have already set up a referral for this server.`
                );
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.newsPreview()],
                    components: [previewButtons()],
                });
                return;
            }

            // 4. else, send the referral modal
            await intr.showModal(referralModal(true));
        } catch (error) {
            await InteractionUtils.warn(
                intr,
                `Something went wrong with the setup. Please run **/setup** again.`
            );
            await Logger.error({
                message: `Error setting up : ${error.message ? error.message : error}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
        }
    }
}
