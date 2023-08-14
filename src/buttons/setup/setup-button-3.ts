import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { setupNewsChannelButtons } from './setup-button-4.js';
import { ethereumPreview } from '../../messages/previews/ethereum.js';
import { solanaPreview } from '../../messages/previews/solana.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { InteractionUtils } from '../../utils/index.js';
import { Button, ButtonDeferType } from '../button.js';

export function setupChainButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId('setupChain_solana')
            .setLabel('Solana NFT Preview')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔗'),
        new ButtonBuilder()
            .setCustomId('setupChain_ethereum')
            .setLabel('Ethereum NFT Preview')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔗'),
        new ButtonBuilder()
            .setCustomId('setupChain _skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('➡'),
    ]);
}

export class SetupChainButtons implements Button {
    ids: string[] = ['setupChain'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            if (intr.customId === 'setupChain_skip') {
                if (intr.message.deletable) await intr.message.delete();
                await intr.channel.send({
                    embeds: [SetupMessages.newsChannel()],
                    components: [setupNewsChannelButtons()],
                });
            }
            if (intr.customId === 'setupChain_solana') {
                intr.reply({
                    embeds: [new EmbedBuilder().setTitle('**Preview Only**'), ...solanaPreview],
                    ephemeral: true,
                });
                return;
            }

            if (intr.customId === 'setupChain_ethereum') {
                intr.reply({
                    embeds: [new EmbedBuilder().setTitle('**Preview Only**'), ...ethereumPreview],
                    ephemeral: true,
                });
                return;
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
