import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './index.js';
import { setupMentionButtons } from './setup-button-5.js';
import { addMentionMenu } from '../menus/mention-add-menu-event.js';
import { SetupMessages } from '../messages/setup.js';
import { GuildSettingsDbUtils, InteractionUtils } from '../utils/index.js';

export function otherNewsChannelButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('otherNewsChannel_skip')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️'),
    ]);
}

export class OtherNewsChannelButtons implements Button {
    ids: string[] = ['otherNewsChannel'];
    deferType = ButtonDeferType.REPLY;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    cooldown = new RateLimiter(1, 5000);
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
        if (!guildSettings) {
            await InteractionUtils.warn(
                intr,
                'Something went wrong. Please try again or contact the developer.'
            );
            return;
        }
        if (intr.customId.split('_')[1] === 'skip') {
            await InteractionUtils.send(intr, SetupMessages.pingRole(), true, [
                addMentionMenu(),
                setupMentionButtons(),
            ]);
        }
    }
}
