import { CommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Command, CommandDeferType } from './index.js';
import { codeModal } from '../modals/code-modal-event.js';
import { EventData } from '../models/internal-models.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { UserDbUtils } from '../utils/database/user-db-utils.js';
import { UserReferralDbUtils } from '../utils/database/user-referrals-db-utils.js';
import { GuildDbUtils, InteractionUtils } from '../utils/index.js';

export class AmbassadorCommand implements Command {
    names = ['ambassador'];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.NONE;

    async execute(intr: CommandInteraction, data: EventData): Promise<void> {
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

        const referralString = `⚫┃Thank you for being ${
            data.staffRole?.staff_role === 'TRIAL' ? 'a trial' : 'an'
        } Ambassador of the Syndicate Discord server!\n🔗┃Referral Code: **${
            referralCode.code
        }**\n🌐┃Referral Link: https://www.syndicatenetwork.io/bot/referral/${
            referralCode.code
        }\n👥┃Guild Referrals: ${guildReferrals.length}\n👤┃User Referrals: ${
            userReferrals.length
        }`;

        let referralAllString = '**Guild Referrals**\n';
        let referralCount = 0;
        for (let i = 0; i < 5; i++) {
            const referral = guildReferrals[i];
            if (!referral) continue;
            const guild = await GuildDbUtils.getGuildById(referral.guild_id);
            referralAllString += `**${i + 1}.** ${guild.name} - ${new Date(
                referral.updated_at
            ).toLocaleDateString()}\n`;
            referralCount += 1;
        }
        if (guildReferrals.length > 5) {
            referralAllString += `**...** ${guildReferrals.length - referralCount} more\n`;
        }

        let referralUserString = '**User Referrals**\n';
        referralCount = 0;
        for (let i = 0; i < 5; i++) {
            const referral = userReferrals[i];
            if (!referral) continue;
            const user = await UserDbUtils.getUserById(referral.user_id);
            referralUserString += `**${i + 1}.** ${user.name} - ${new Date(
                referral.created_at
            ).toLocaleDateString()}\n`;
            referralCount += 1;
        }
        if (userReferrals.length > 5) {
            referralUserString += `**...** ${userReferrals.length - referralCount} more\n`;
        }

        await InteractionUtils.success(
            intr,
            `${referralString}\n\n${referralAllString}\n${referralUserString}`,
            []
        );
    }
}
