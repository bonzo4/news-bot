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
        .setCustomId(walletButtonId ? `wallet_${type}_${walletButtonId}` : `wallet_${type}`);

    if (type === 'sol') {
        const solWallet = new TextInputBuilder()
            .setCustomId('solWallet')
            .setLabel('SOL Wallet')
            .setPlaceholder('Enter SOL Wallet')
            .setStyle(TextInputStyle.Short);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents([solWallet]);

        modal.addComponents([row]);

        return modal;
    } else if (type === 'eth') {
        const ethWallet = new TextInputBuilder()
            .setCustomId('ethWallet')
            .setLabel('ETH Wallet')
            .setPlaceholder('Enter ETH Wallet')
            .setStyle(TextInputStyle.Short);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents([ethWallet]);

        modal.addComponents([row]);

        return modal;
    }
}

export class WalletModal implements ModalSubmit {
    ids: string[] = ['wallet'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.REPLY;

    async execute(intr: ModalSubmitInteraction, data: EventData): Promise<void> {
        const walletButtonId = parseInt(intr.customId.split('_')[2]);

        const walletType = intr.customId.split('_')[1];

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

        if (walletType === 'sol') {
            const solWallet = intr.fields.getTextInputValue('solWallet');
            if (solWallet.length < 40) {
                await InteractionUtils.warn(intr, 'Please enter a valid SOL wallet.');
                return;
            }
            await ProfileDbUtils.updateSolWallet(profile.id, solWallet);
            await InteractionUtils.success(intr, 'SOL Wallet updated successfully.', [
                profileButtons(),
            ]);
        }

        if (walletType === 'eth') {
            const ethWallet = intr.fields.getTextInputValue('ethWallet');
            if (ethWallet.length < 40) {
                await InteractionUtils.warn(intr, 'Please enter a valid ETH wallet.');
                return;
            }
            await ProfileDbUtils.updateEthWallet(profile.id, ethWallet);
            await InteractionUtils.success(intr, 'ETH Wallet updated successfully.', [
                profileButtons(),
            ]);
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
        } else {
            await WalletInteractionDbUtils.createInteraction({
                user_id: data.userData.id,
                guild_id: intr.guildId,
            });
        }
    }
}
