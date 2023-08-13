import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { setupChainButtons } from './setup-button-3.js';
import { setupChainMenu } from '../../menus/chain-menu-event.js';
import { generaPreview } from '../../messages/previews/general.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { InteractionUtils } from '../../utils/index.js';
import { Button, ButtonDeferType } from '../button.js';

export function previewButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('crypto_preview')
            .setLabel('Preview')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛠️'),
        new ButtonBuilder()
            .setCustomId('crypto_next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('➡️'),
    ]);
}

export class PreviewButtons implements Button {
    ids: string[] = ['crypto'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            if (intr.customId === 'crypto_preview') {
                intr.reply({
                    embeds: [new EmbedBuilder().setTitle('**Preview Only**'), ...generaPreview],
                    ephemeral: true,
                });
                return;
            }

            if (intr.customId === 'crypto_next') {
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.newsChain()],
                    components: [await setupChainMenu(), setupChainButtons()],
                });
            }
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
