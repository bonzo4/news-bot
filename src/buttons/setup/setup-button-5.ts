import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { InteractionUtils } from '../../utils/index.js';
import { Button, ButtonDeferType } from '../button.js';
import { systemButtons, systemLinks } from '../system.js';

export function setupMentionButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupPingRole_next')
            .setLabel('Finish')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️'),
    ]);
}

export class SetupMentionButtons implements Button {
    ids: string[] = ['setupPingRole'];
    deferType = ButtonDeferType.NONE;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            // 1. If they press Finish, finish the setup
            if (intr.customId.split('_')[1] === 'next') {
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.systemMessage()],
                    components: [systemLinks(), systemButtons()],
                });
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
