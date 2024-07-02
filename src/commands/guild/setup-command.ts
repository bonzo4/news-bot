import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CategoryChannel,
    CommandInteraction,
    GuildTextBasedChannel,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { mentionButtons } from '../../buttons/mention-button-event.js';
import { setupReferralButtons } from '../../buttons/referral-button-event.js';
import { setupChainMenu } from '../../menus/chain-menu-event.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import { GuildReferralDbUtils } from '../../utils/database/referral-db-utils.js';
import {
    BannerUtils,
    ChannelDbUtils,
    ChannelUtils,
    GuildDbUtils,
    GuildSettingsDbUtils,
    GuildUtils,
    InteractionUtils,
} from '../../utils/index.js';
import { NewsChannelsUtils } from '../../utils/news-channels-utils.js';
import { Command, CommandDeferType } from '../index.js';

export class SetupCommand implements Command {
    names = ['setup'];
    requireAdmin = true;
    requireGuild = true;
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.HIDDEN;
    requireClientPerms = ['ManageChannels', 'ManageRoles'] as PermissionsString[];

    async execute(intr: CommandInteraction): Promise<void> {
        try {
            // check if guild exists in db & create banner
            const guildDoc = await GuildDbUtils.createGuild(intr.guild);
            let banner = guildDoc.banner;
            if (!banner) banner = await BannerUtils.createBanner(intr.guild);

            // check if guild settings exist in db & if channels exists
            let guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);

            const referral = await GuildReferralDbUtils.getReferralByGuildId(intr.guild.id);
            let categoryChannel: CategoryChannel;
            let systemChannel: GuildTextBasedChannel;
            if (!guildSettings) {
                categoryChannel = await ChannelUtils.createParent(intr.guild);
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                const announcementChannel = await GuildUtils.findAnnouncementChannel(intr.guild);
                guildSettings = await GuildSettingsDbUtils.createGuildSettings({
                    guildId: intr.guildId,
                    systemChannel,
                    categoryChannel,
                    announcementChannel,
                });
                await systemChannel.send({
                    embeds: [SetupMessages.setupMessage1()],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setLabel('Get Support')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://discord.gg/vsFzFfqfGD')
                        ),
                    ],
                });

                await systemChannel.send({
                    embeds: [SetupMessages.setupMessage2()],
                    components: [await setupChainMenu()],
                });

                await systemChannel.send({
                    embeds: [SetupMessages.setupMessage3()],
                    components: [mentionButtons()],
                });

                if (!referral.discord_user_id) {
                    await systemChannel.send({
                        embeds: [SetupMessages.setupMessage4()],
                        components: [setupReferralButtons()],
                    });
                }

                const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(intr.guildId);
                if (newsChannels.length >= 5) {
                    return;
                }
                const newsChannel = await ChannelUtils.createNewsChannel(categoryChannel);
                await ChannelDbUtils.createGuildChannel(intr.guildId, newsChannel);

                await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
                return;
            }
            if (guildSettings.category_id)
                categoryChannel = intr.guild.channels.cache.find(
                    channel => channel.id === guildSettings.category_id
                ) as CategoryChannel;
            if (guildSettings.system_id)
                systemChannel = intr.guild.channels.cache.find(
                    channel => channel.id === guildSettings.system_id
                ) as GuildTextBasedChannel;
            if (!categoryChannel) {
                categoryChannel = await ChannelUtils.createParent(intr.guild);
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: intr.guildId,
                    systemChannel: systemChannel,
                    categoryChannel: categoryChannel,
                });
                await InteractionUtils.success(
                    intr,
                    `Something was wrong with the category channel. It and a system channel has been recreated.`
                );
            }
            if (categoryChannel && !systemChannel) {
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: intr.guildId,
                    systemChannel: systemChannel,
                });
                await InteractionUtils.success(
                    intr,
                    `Something was wrong with the system channel. It has been recreated.`
                );
            }

            await systemChannel.send({
                embeds: [SetupMessages.setupMessage1()],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('Get Support')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://discord.gg/vsFzFfqfGD')
                    ),
                ],
            });

            await systemChannel.send({
                embeds: [SetupMessages.setupMessage2()],
                components: [await setupChainMenu()],
            });

            await systemChannel.send({
                embeds: [SetupMessages.setupMessage3()],
                components: [mentionButtons()],
            });

            if (!referral.discord_user_id) {
                await systemChannel.send({
                    embeds: [SetupMessages.setupMessage4()],
                    components: [setupReferralButtons()],
                });
            }

            const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(intr.guildId);
            if (newsChannels.length >= 5) {
                return;
            }
            const newsChannel = await ChannelUtils.createNewsChannel(categoryChannel);
            await ChannelDbUtils.createGuildChannel(intr.guildId, newsChannel);

            await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);

            await InteractionUtils.success(
                intr,
                `Setup has been completed. Please check ${systemChannel.toString()} for more information.`
            );
        } catch (err) {
            await InteractionUtils.error(
                intr,
                `Error setting up guild, please contact a syndicate staff member.`
            );
            await Logger.error({
                message: `Error setting up guild: ${err}`,
                guildId: intr.guildId,
            });
        }
    }
}
