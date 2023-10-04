import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import DiscordActionDbUtils from '../utils/database/action-db-utils.js';
import { EmbedDbUtils } from '../utils/database/embed-db-utils.js';
import GuildRewardDbUtils from '../utils/database/guild-reward-db-utils.js';
import { PointsDbUtils } from '../utils/database/points-db-utils.js';
import { PollInteractionDbUtils } from '../utils/database/poll-interaction-db-utils.js';
import { ProfileButtonDbUtils } from '../utils/database/profile-button-db-utils.js';
import ProfileDbUtils from '../utils/database/profile-db-utils.js';
import { ProfileInteractionDbUtils } from '../utils/database/profile-interaction-db-utils.js';
import ReferralCodeDbUtils from '../utils/database/referral-code-db-utils.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import { GuildDbUtils, InteractionUtils } from '../utils/index.js';

export function profileButtons(profileButtonId?: number): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(profileButtonId ? `profile_${profileButtonId}` : 'profile')
            .setLabel('Syndicate Profile')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚪'),
    ]);
}

export class ProfileButtons implements Button {
    ids: string[] = ['profile'];
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);

    async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        try {
            const profileButtonId = intr.customId.split('_')[1];

            let messageBody = '';

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

            if (profileButtonId) {
                const profileButton = await ProfileButtonDbUtils.getProfileButtonById(
                    parseInt(profileButtonId)
                );

                const embed = await EmbedDbUtils.getEmbedById(profileButton.embed_id);

                await ProfileInteractionDbUtils.createInteraction({
                    user_id: intr.user.id,
                    guild_id: intr.guildId,
                    news_id: embed.news_id,
                    profile_button_id: profileButton.id,
                });
            } else {
                await ProfileInteractionDbUtils.createInteraction({
                    user_id: intr.user.id,
                    guild_id: intr.guildId,
                });
            }

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
                true
            );
        } catch (err) {
            await InteractionUtils.error(
                intr,
                `Could not access your Syndicate Profile at this time please contact staff for assistance.`
            );
            await Logger.error({
                message: `Could not setup Syndicate Profile:\n${err}`,
                userId: intr.user.id,
                guildId: intr.guildId,
            });
        }
    }
}
