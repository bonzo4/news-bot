import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { setupReferralButtons } from './setup-button-1a.js';
import { previewButtons } from './setup-button-2.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { GuildReferralDbUtils } from '../../utils/database/referral-db-utils.js';
import { InteractionUtils } from '../../utils/index.js';
import { Button, ButtonDeferType } from '../button.js';

export function setupButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setup')
            .setLabel('Setup')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛠️'),
    ]);
}

export class SetupButtons implements Button {
    ids: string[] = ['setup'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        // Once someone clicks on "setup"

        try {
            // 1. check if they have already set up a referral for this server
            const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guildId);

            // delete the setup message
            if (intr.message.deletable) await intr.message.delete();

            // 2. if they have already set up a referral for this server, skip the referral setup
            if (referral.discord_user_id) {
                await intr.channel.send({
                    embeds: [SetupMessages.newsPreview()],
                    components: [previewButtons()],
                });
                return;
            }

            // 2. else, send the referral setup message
            await intr.channel.send({
                embeds: [SetupMessages.referral()],
                components: [setupReferralButtons()],
            });
        } catch (error) {
            await InteractionUtils.error(
                intr,
                'There was an error setting up please contact staff for assistance'
            );
            await Logger.error({
                message: `Error setting up : ${error.message ? error.message : error}`,
                guildId: intr.guildId,
                userId: intr.user.id,
            });
        }
    }
}
