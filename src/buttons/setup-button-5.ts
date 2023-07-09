import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './index.js';
import { setupReferralButtons } from './setup-button-6.js';
import { systemButtons, systemLinks } from './system.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/logger.js';
import { ReferralDbUtils } from '../utils/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function setupMentionButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupPingRole_skip')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️'),
        new ButtonBuilder()
            .setCustomId('setupPingRole_next')
            .setLabel('No Ping')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌'),
    ]);
}

export class SetupMentionButtons implements Button {
    ids: string[] = ['setupPingRole'];
    deferType = ButtonDeferType.REPLY;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            if (intr.customId.split('_')[1] === 'skip' || intr.customId.split('_')[1] === 'next') {
                const referral = await ReferralDbUtils.getGuildReferralByGuild(intr.guildId);
                if (referral.user_id) {
                    await intr.channel.bulkDelete(100);
                    await intr.channel.send({
                        embeds: [SetupMessages.systemMessage()],
                        components: [systemLinks(), systemButtons()],
                    });
                    await InteractionUtils.success(intr, 'Setup complete');
                    return;
                }
                await InteractionUtils.send(intr, SetupMessages.referral(), true, [
                    setupReferralButtons(),
                ]);
                return;
            }
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
