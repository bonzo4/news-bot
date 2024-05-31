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
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { supabase } from '../utils/database/index.js';
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

            // new ambassador date to today as in 5 27 2024
            const newAmbassadorDate = new Date();
            newAmbassadorDate.setFullYear(2024, 4, 27);

            const { count } = await supabase
                .from('guild_referrals')
                .select('', { count: 'exact' })
                .eq('user_id', referralCode.discord_id)
                .gt('created_at', newAmbassadorDate);

            if (count === 5) {
                await intr.client.shard.broadcastEval(broadcastReferralGoal, {
                    context: { userId: referralCode.discord_id },
                });
            }
            await intr.client.shard.broadcastEval(broadcastReferral, {
                context: { guildId: intr.guild.id, userId: referralCode.discord_id },
            });
            await InteractionUtils.success(intr, 'Referral code used!');
            return;
        }

        referralCode = await ReferralCodeDbUtils.getCodeByCode(code);

        if (referralCode) {
            await GuildReferralDbUtils.createProfileReferral(
                intr.guild.id,
                referralCode.discord_id
            );

            await InteractionUtils.success(intr, 'Referral code used!');
            await intr.client.shard.broadcastEval(broadcastReferral, {
                context: { guildId: intr.guild.id, userId: referralCode.discord_id },
            });
            return;
        }

        await InteractionUtils.warn(intr, 'Invalid referral code');
    }
}

export function broadcastReferral(
    client: Client,
    { guildId, userId }: { guildId: string; userId: string }
): void {
    client.emit('guildReferral', { guildId, userId });
}

export function broadcastReferralGoal(client: Client, { userId }: { userId: string }): void {
    client.emit('guildReferralGoal', { userId });
}
