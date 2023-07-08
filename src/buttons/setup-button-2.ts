import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { setupNewsChannelButtons } from './setup-button-3.js';
import { SetupMessages } from '../messages/setup.js';
import { InteractionUtils } from '../utils/index.js';

export function setupChainButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupChain_skip')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️'),
    ]);
}

export class SetupChainButtons implements Button {
    ids: string[] = ['setupChain'];
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        if (intr.customId.split('_')[1] === 'skip')
            await InteractionUtils.send(intr, SetupMessages.newsChannel(), true, [
                setupNewsChannelButtons(),
            ]);
    }
}
