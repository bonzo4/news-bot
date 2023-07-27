import { CommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Command, CommandDeferType } from './index.js';
import { codeModal } from '../modals/code-modal-event.js';
import { EventData } from '../models/internal-models.js';
import { GuildDbUtils, InteractionUtils, ReferralDbUtils } from '../utils/index.js';

export class AmbassadorCommand implements Command {
    names = ['ambassador'];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.NONE;

    async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        if (!data.userData.referral_code) {
            const modal = codeModal(false);
            await intr.showModal(modal);
            return;
        }

        const referrals = await ReferralDbUtils.getReferralsByUser(data.userData.id);

        const referralString = `⚫┃Thank you for being ${
            data.userData.staff_role === 'TRIAL' ? 'a trial' : 'an'
        } Ambassador of the Syndicate Discord server!\n🔗┃Referral Code: **${
            data.userData.referral_code
        }**\n👥┃Referrals: ${referrals.length} Total`;

        let referralAllString = '';
        for (let i = 0; i < referrals.length; i++) {
            const referral = referrals[i];
            const guild = await GuildDbUtils.getGuildById(referral.guild_id);
            referralAllString += `**${i + 1}.** ${guild.name} - ${new Date(
                referral.created_at
            ).toLocaleDateString()}\n`;
        }

        await InteractionUtils.success(intr, `${referralString}\n\n${referralAllString}`);
    }
}
