import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { setupChainButtons } from './setup-button-2.js';
import { setupChainMenu } from '../menus/chain-menu-event.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/logger.js';
import { InteractionUtils } from '../utils/index.js';

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
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            await InteractionUtils.send(intr, SetupMessages.chain(), true, [
                await setupChainMenu(),
                setupChainButtons(),
            ]);
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
