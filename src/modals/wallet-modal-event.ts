import {
    ActionRowBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { profileButtons } from '../buttons/profile-button-event.js';
import { EventData } from '../models/internal-models.js';
import DiscordActionDbUtils from '../utils/database/action-db-utils.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import ProfileDbUtils from '../utils/database/profile-db-utils.js';
import ReferralCodeDbUtils from '../utils/database/referral-code-db-utils.js';
import { WalletButtonDbUtils } from '../utils/database/wallet-button-db-utils.js';
import { WalletInteractionDbUtils } from '../utils/database/wallet-interaction-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function walletModal(type: 'sol' | 'eth', walletButtonId: number): ModalBuilder {
    const modal = new ModalBuilder()
        .setTitle('Syndicate News')
        .setCustomId(walletButtonId ? `wallet_${walletButtonId}` : 'wallet');

    if (type === 'sol') {
        const solWallet = new TextInputBuilder()
            .setCustomId('solWallet')
            .setLabel('SOL Wallet')
            .setPlaceholder('Enter SOL Wallet')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents([solWallet]);

        modal.addComponents([row]);

        return modal;
    } else if (type === 'eth') {
        const ethWallet = new TextInputBuilder()
            .setCustomId('ethWallet')
            .setLabel('ETH Wallet')
            .setPlaceholder('Enter ETH Wallet')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents([ethWallet]);

        modal.addComponents([row]);

        return modal;
    }
}

export class WalletModal implements ModalSubmit {
    ids: string[] = ['code'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const walletButtonId = parseInt(intr.customId.split('_')[1]);

        const solWallet = intr.fields.getTextInputValue('solWallet');
        const ethWallet = intr.fields.getTextInputValue('ethWallet');

        let profile = await ProfileDbUtils.getProfileByDiscordId(data.userData.id);

        if (!profile) {
            const points = await DiscordActionDbUtils.getPointsByUserId(data.userData.id);
            profile = await ProfileDbUtils.createProfile(data.userData, points);
            if (!profile) {
                await InteractionUtils.error(
                    intr,
                    'Could not create profile, please try again later.'
                );
                return;
            }

            let code = await ReferralCodeDbUtils.getCodeByDiscordId(data.userData.id);

            if (!code) {
                await ReferralCodeDbUtils.createCode(data.userData.id);
            }
        }

        if (solWallet && solWallet !== '') {
            await ProfileDbUtils.updateSolWallet(profile.id, solWallet);
        }

        if (ethWallet && ethWallet !== '') {
            await ProfileDbUtils.updateEthWallet(profile.id, ethWallet);
        }

        if (walletButtonId) {
            const walletButton = await WalletButtonDbUtils.getWalletButtonById(walletButtonId);

            const embed = await EmbedDbUtils.getEmbedById(walletButton.embed_id);

            await WalletInteractionDbUtils.createInteraction({
                user_id: data.userData.id,
                wallet_button_id: walletButtonId,
                guild_id: intr.guildId,
                news_id: embed.news_id,
            });
        }

        await InteractionUtils.success(intr, 'Wallet updated successfully.', [profileButtons()]);
    }
}
