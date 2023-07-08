import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

import { Button, ButtonDeferType } from './index.js';
import { setupReferralButtons } from './setup-button-6.js';
import { systemButtons } from './system.js';
import { SetupMessages } from '../messages/setup.js';
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

    async execute(intr: ButtonInteraction): Promise<void> {
        if (intr.customId.split('_')[1] === 'skip' || intr.customId.split('_')[1] === 'next') {
            const referral = await ReferralDbUtils.getGuildReferralByGuild(intr.guildId);
            if (referral.user_id) {
                await intr.channel.bulkDelete(100);
                await intr.channel.send({
                    embeds: [SetupMessages.systemMessage()],
                    components: [systemButtons()],
                });
                await InteractionUtils.success(intr, 'Setup complete');
                return;
            }
            await InteractionUtils.send(intr, SetupMessages.referral(), true, [
                setupReferralButtons(),
            ]);
            return;
        }
    }
}
