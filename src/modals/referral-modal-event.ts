import {
    ActionRowBuilder,
    Client,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { ModalDeferType, ModalSubmit } from './modalSubmit.js';
import { previewButtons } from '../buttons/setup/setup-button-2.js';
import { SetupMessages } from '../messages/setup.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import ReferralCodeDbUtils from '../utils/database/referral-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export function referralModal(setup: boolean): ModalBuilder {
    const modal = new ModalBuilder()
        .setTitle('Syndicate News')
        .setCustomId(`referralCode_${setup}`);

    const referral = new TextInputBuilder()
        .setCustomId('referralCode')
        .setLabel('Referral Code')
        .setPlaceholder('Enter referral Code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([referral]);

    modal.addComponents([row]);

    return modal;
}

export class ReferralModal implements ModalSubmit {
    ids = ['referralCode'];
    cooldown = new RateLimiter(1, 5000);
    deferType = ModalDeferType.NONE;
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: ModalSubmitInteraction): Promise<void> {
        const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guildId);

        if (referral.discord_user_id) {
            await InteractionUtils.warn(
                intr,
                `You have already set up a referral for this server.`
            );
            return;
        }

        const setup = intr.customId.endsWith('true');

        const code = intr.fields.getTextInputValue('referralCode');
        if (!code) {
            await InteractionUtils.warn(intr, 'Please enter a referral code');
            return;
        }

        let referralCode = await AmbassadorCodeDbUtils.getCodeByCode(code);

        if (referralCode) {
            await GuildReferralDbUtils.createAmbassadorReferral(
                intr.guild.id,
                referralCode.discord_id
            );

            await InteractionUtils.success(intr, 'Referral code used!');
            await broadcastReferral(intr.client, {
                guildId: intr.guild.id,
                userId: referralCode.discord_id,
            });
        }

        referralCode = await ReferralCodeDbUtils.getCodeByCode(code);

        if (referralCode) {
            await GuildReferralDbUtils.createProfileReferral(
                intr.guild.id,
                referralCode.discord_id
            );

            await InteractionUtils.success(intr, 'Referral code used!');
            await broadcastReferral(intr.client, {
                guildId: intr.guild.id,
                userId: referralCode.discord_id,
            });
        }

        if (setup) {
            if (intr.message.deletable) await intr.message.delete();
            await intr.channel.send({
                embeds: [SetupMessages.newsPreview()],
                components: [previewButtons()],
            });
            return;
        }
        await InteractionUtils.warn(intr, 'Invalid referral code');
    }
}

export async function broadcastReferral(
    client: Client,
    { guildId, userId }: { guildId: string; userId: string }
): Promise<void> {
    client.emit('guildReferral', { guildId, userId });
}
