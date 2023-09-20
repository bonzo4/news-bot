import { CommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Command, CommandDeferType } from './index.js';
import { codeModal } from '../modals/code-modal-event.js';
import { EventData } from '../models/internal-models.js';
import { AmbassadorCodeDbUtils } from '../utils/database/ambassador-code-db-utils.js';
import { GuildDbUtils, InteractionUtils, ReferralDbUtils } from '../utils/index.js';

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

        const referrals = await ReferralDbUtils.getReferralsByUserId(data.userData.id);

        const referralString = `⚫┃Thank you for being ${
            data.userData.staff_role === 'TRIAL' ? 'a trial' : 'an'
        } Ambassador of the Syndicate Discord server!\n🔗┃Referral Code: **${
            referralCode.code
        }**\n👥┃Referrals: ${referrals.length} Total`;

        let referralAllString = '';
        let referralCount = 0;
        for (let i = 0; i < 10; i++) {
            const referral = referrals[i];
            if (!referral) continue;
            const guild = await GuildDbUtils.getGuildById(referral.guild_id);
            referralAllString += `**${i + 1}.** ${guild.name} - ${new Date(
                referral.created_at
            ).toLocaleDateString()}\n`;
            referralCount += 1;
        }
        if (referrals.length > 10) {
            referralAllString += `**...** ${referrals.length - referralCount} more`;
        }

        await InteractionUtils.success(intr, `${referralString}\n\n${referralAllString}`);
    }
}
