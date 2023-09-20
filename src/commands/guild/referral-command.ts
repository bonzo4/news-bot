import { CommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { referralModal } from '../../modals/referral-modal-event.js';
import { GuildDbUtils, InteractionUtils, ReferralDbUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class ReferralCommand implements Command {
    names = ['referral'];
    requireAdmin = true;
    requireGuild = true;
    requireClientPerms = [] as PermissionsString[];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.NONE;

    async execute(intr: CommandInteraction): Promise<void> {
        const guildDoc = await GuildDbUtils.getGuildById(intr.guildId);

        if (!guildDoc) {
            await InteractionUtils.warn(
                intr,
                `This server has not been set up yet. Please run \`/setup\` first.`
            );
            return;
        }

        const referral = await ReferralDbUtils.getGuildReferralByGuild(intr.guildId);

        if (referral.discord_user_id) {
            await InteractionUtils.warn(
                intr,
                `You have already set up a referral for this server.`
            );
            return;
        }

        const now = new Date();
        const createdAt = new Date(referral.created_at);
        const diff = now.getTime() - createdAt.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 7) {
            await InteractionUtils.warn(
                intr,
                'It is too late to set up a referral for this server.'
            );
            return;
        }

        const modal = referralModal(false);

        await intr.showModal(modal);
    }
}
