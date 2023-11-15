import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Command, CommandDeferType } from './index.js';
import { walletButtons } from '../buttons/wallet-button-event.js';
import { EventData } from '../models/internal-models.js';
import DiscordActionDbUtils from '../utils/database/action-db-utils.js';
import GuildRewardDbUtils from '../utils/database/guild-reward-db-utils.js';
import { PointsDbUtils } from '../utils/database/points-db-utils.js';
import { PollInteractionDbUtils } from '../utils/database/poll-interaction-db-utils.js';
import ProfileDbUtils from '../utils/database/profile-db-utils.js';
import { ProfileInteractionDbUtils } from '../utils/database/profile-interaction-db-utils.js';
import ReferralCodeDbUtils from '../utils/database/referral-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { GuildDbUtils, InteractionUtils } from '../utils/index.js';

export class ProfileCommand implements Command {
    names = ['profile'];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.HIDDEN;

    async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        try {
            let messageBody = '';

            let profile = await ProfileDbUtils.getProfileByDiscordId(data.userData.id);

            if (!profile) {
                profile = await ProfileDbUtils.createProfile(data.userData);
                if (!profile) {
                    await InteractionUtils.error(
                        intr,
                        'Could not create profile, please try again later.'
                    );
                    return;
                }
                messageBody = '📝┃Created profile, welcome to the Syndicate Network.\n\n';
            }

            let code = await ReferralCodeDbUtils.getCodeByDiscordId(data.userData.id);

            if (!code) {
                await ReferralCodeDbUtils.createCode(data.userData.id);
                code = await ReferralCodeDbUtils.getCodeByDiscordId(data.userData.id);
            }

            const dailyCheckInPoints = await PointsDbUtils.giveDailyProfilePoints({
                userId: data.userData.id,
                guildId: intr.guildId,
                newsId: 0,
            });

            await ProfileInteractionDbUtils.createInteraction({
                user_id: intr.user.id,
                guild_id: intr.guildId,
            });

            if (dailyCheckInPoints > 0) {
                messageBody += `✅┃Checked in for the day, you received **${dailyCheckInPoints} points**.\n\n`;
            }

            messageBody += `📅┃Date Joined: ${new Date(profile.created_at).toLocaleDateString()}\n`;

            const points = await DiscordActionDbUtils.getPointsByUserId(data.userData.id);

            messageBody += `🎁┃Points: ${points}\n`;

            const votes = await PollInteractionDbUtils.getVoteCountByUserId(data.userData.id);

            messageBody += `🙌┃# of Votes: ${votes}\n`;

            const favoriteGuildId = await DiscordActionDbUtils.getFavoriteGuild(data.userData.id);

            const favoriteGuild = await GuildDbUtils.getGuildById(favoriteGuildId);

            messageBody += `🏰┃Favorite Guild: ${favoriteGuild ? favoriteGuild.name : 'None'}\n`;

            const referrals = await GuildReferralDbUtils.getProfileReferralsByUserId(
                data.userData.id
            );

            const nextReward = await GuildRewardDbUtils.getNextReward(referrals.length);

            const lastActions = await DiscordActionDbUtils.getLastActionsByUserId(data.userData.id);

            const away = nextReward.guild_requirement - referrals.length;

            messageBody += `🔗┃Referral Code: **${code.code}**\n👥┃Referrals: **${
                referrals.length
            } Total**\n🏆┃**Next Reward: ${nextReward.title} (${away} referral${
                away === 1 ? '' : 's'
            } away)**\n🌐┃Referral Link: https://www.syndicatenetwork.io/bot/referral/${
                code.code
            }\n\n`;

            if (profile.sol_wallet && profile.sol_wallet !== '') {
                messageBody += `💸┃SOL Wallet: ${profile.sol_wallet}\n`;
            }

            if (profile.eth_wallet && profile.eth_wallet !== '') {
                messageBody += `💸┃ETH Wallet: ${profile.eth_wallet}\n`;
            }

            messageBody += '\n';

            if (referrals.length > 0) {
                const referralSpliced = referrals.splice(0, 5);
                let referralList = '**Referral History:**\n';

                for (let i = 0; i < referralSpliced.length; i++) {
                    const referral = referralSpliced[i];
                    const guild = await GuildDbUtils.getGuildById(referral.guild_id);
                    referralList += `**${i + 1}.** ${guild.name} - ${new Date(
                        referral.created_at
                    ).toLocaleDateString()}\n`;
                }

                messageBody += `${referralList}\n`;
            }

            messageBody += `**Activity History:**\n${lastActions
                .map((action, index) => {
                    return `**${index + 1}.** **${action.points} points** - ${
                        action.action
                    } - ${new Date(action.created_at).toLocaleDateString()}`;
                })
                .join('\n')}`;

            await InteractionUtils.send(
                intr,
                new EmbedBuilder()
                    .setTitle(`📰┃Welcome to your Syndicate Profile`)
                    .setDescription(messageBody)
                    .setThumbnail(data.userData.icon)
                    .setTimestamp()
                    .setImage(
                        'https://cdn.discordapp.com/attachments/988242915027460146/1156733608766222347/image.png?ex=651df49f&is=651ca31f&hm=4052db0f3d3752a83e818f094de9cf439cedfaa34a6605bf545c1947c54e78de&'
                    )
                    .setColor(0x000),
                true,
                [walletButtons()]
            );
        } catch (err) {
            await InteractionUtils.error(intr, 'Could not get profile, please try again later.');
            console.error(`Failed to get profile: ${err}`);
        }
    }
}
