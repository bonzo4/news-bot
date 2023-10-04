import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { codeModal } from '../modals/code-modal-event.js';
import { EventData } from '../models/internal-models.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { UserDbUtils } from '../utils/database/user-db-utils.js';
import { UserReferralDbUtils } from '../utils/database/user-referrals-db-utils.js';
import { GuildDbUtils, InteractionUtils } from '../utils/index.js';

export function ambassadorButtons(page: number = 0): ActionRowBuilder<ButtonBuilder> {
    if (page < 0) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setCustomId(`ambassador_${page - 1}`)
                .setLabel('Previous Page')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⚪'),
        ]);
    }
    if (page === 0) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setCustomId(`ambassador_${page + 1}`)
                .setLabel('Next Page')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚪'),
        ]);
    }
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(`ambassador_${page - 1}`)
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚪'),
        new ButtonBuilder()
            .setCustomId(`ambassador_${page + 1}`)
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚪'),
    ]);
}

export class ProfileButtons implements Button {
    ids: string[] = ['ambassador'];
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        let page = parseInt(intr.customId.split('_')[1]);

        const referralCode = await AmbassadorCodeDbUtils.getCodeByDiscordId(data.userData.id);

        if (!referralCode) {
            const modal = codeModal();
            await intr.showModal(modal);
            return;
        }

        const guildReferrals = await GuildReferralDbUtils.getAmbassadorReferralsByUserId(
            data.userData.id
        );

        const userReferrals = await UserReferralDbUtils.getReferralsByReferrerId(data.userData.id);

        let referralGuildString = '**👥┃Guild Referrals**\n';
        for (let i = 0; i < 5; i++) {
            const referral = guildReferrals[i];
            if (!referral) continue;
            const guild = await GuildDbUtils.getGuildById(referral.guild_id);
            referralGuildString += `**${i + 1}.** ${guild.name} - ${new Date(
                referral.updated_at
            ).toLocaleDateString()}\n`;
        }

        let referralUserString = '**👤┃User Referrals**\n';
        for (let i = 0; i < 5; i++) {
            const referral = userReferrals[i];
            if (!referral) continue;
            const user = await UserDbUtils.getUserById(referral.user_id);
            referralUserString += `**${i + 1}.** ${user.name} - ${new Date(
                referral.created_at
            ).toLocaleDateString()}\n`;
        }

        if (guildReferrals.length < 5 && userReferrals.length < 5) {
            await InteractionUtils.success(intr, `${referralGuildString}\n${referralUserString}`, [
                ambassadorButtons(-1),
            ]);
        }

        await InteractionUtils.success(intr, `${referralGuildString}\n${referralUserString}`, [
            ambassadorButtons(page),
        ]);
    }
}
