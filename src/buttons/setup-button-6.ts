import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './index.js';
import { systemButtons, systemLinks } from './system.js';
import { SetupMessages } from '../messages/setup.js';
import { referralModal } from '../modals/referral-modal-event.js';
import { Logger } from '../services/logger.js';
import { InteractionUtils, ReferralDbUtils } from '../utils/index.js';

export function setupReferralButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupReferral')
            .setLabel('Submit')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📄'),
        new ButtonBuilder()
            .setCustomId('setupReferral_skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌'),
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
            const referral = await ReferralDbUtils.getGuildReferralByGuild(intr.guildId);

            if (referral.user_id) {
                await InteractionUtils.warn(
                    intr,
                    `You have already set up a referral for this server.`
                );
                await intr.channel.bulkDelete(100);
                await intr.channel.send({
                    embeds: [SetupMessages.systemMessage()],
                    components: [systemLinks(), systemButtons()],
                });
                await InteractionUtils.success(intr, 'Setup complete');
                return;
            }

            if (intr.customId.split('_')[1] === 'skip') {
                await intr.channel.bulkDelete(100);
                await intr.channel.send({
                    embeds: [SetupMessages.systemMessage()],
                    components: [systemLinks(), systemButtons()],
                });
                await InteractionUtils.success(intr, 'Setup complete');
                return;
            }

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
