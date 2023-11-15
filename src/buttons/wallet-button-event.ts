import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { walletModal } from '../modals/wallet-modal-event.js';
import { Logger } from '../services/logger.js';
import { WalletButton } from '../utils/database/wallet-button-db-utils.js';
import { InteractionUtils } from '../utils/index.js';

export function walletButtons(walletButton?: WalletButton): ActionRowBuilder<ButtonBuilder> {
    const walletButtonId = walletButton ? walletButton.id : undefined;
    const sol = walletButton ? walletButton.sol : true;
    const eth = walletButton ? walletButton.eth : true;

    let row = new ActionRowBuilder<ButtonBuilder>();

    if (sol) {
        row.addComponents([
            new ButtonBuilder()
                .setCustomId(walletButtonId ? `wallet_sol_${walletButtonId}` : 'wallet_sol')
                .setLabel('Submit SOL Wallet')
                .setStyle(ButtonStyle.Primary),
        ]);
    }

    if (eth) {
        row.addComponents([
            new ButtonBuilder()
                .setCustomId(walletButtonId ? `wallet_eth_${walletButtonId}` : 'wallet_eth')
                .setLabel('Submit ETH Wallet')
                .setStyle(ButtonStyle.Primary),
        ]);
    }

    return row;
}

export class WalletButtons implements Button {
    ids: string[] = ['wallet'];
    deferType = ButtonDeferType.NONE;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            const walletButtonType = intr.customId.split('_')[1];
            const walletButtonId = parseInt(intr.customId.split('_')[2]);

            if (walletButtonType === 'sol') {
                await intr.showModal(walletModal(walletButtonType, walletButtonId));
            } else if (walletButtonType === 'eth') {
                await intr.showModal(walletModal(walletButtonType, walletButtonId));
            }
        } catch (err) {
            await InteractionUtils.error(
                intr,
                `There is something wrong with this button. Please try again later.`
            );
            await Logger.error({
                message: `Could not setup Syndicate Profile:\n${err}`,
                userId: intr.user.id,
                guildId: intr.guildId,
            });
        }
    }
}
