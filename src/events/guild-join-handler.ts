import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CategoryChannel,
    Client,
    Guild,
    GuildTextBasedChannel,
} from 'discord.js';

import { EventHandler } from './index.js';
import { mentionButtons } from '../buttons/mention-button-event.js';
import { setupReferralButtons } from '../buttons/referral-button-event.js';
import { setupChainMenu } from '../menus/chain-menu-event.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/index.js';
import { GuildReferralDbUtils } from '../utils/database/referral-db-utils.js';
import {
    BannerUtils,
    ChannelDbUtils,
    ChannelUtils,
    GuildDbUtils,
    GuildSettingsDbUtils,
    GuildUtils,
} from '../utils/index.js';
import { NewsChannelsUtils } from '../utils/news-channels-utils.js';

export class GuildJoinHandler implements EventHandler {
    public async process(guild: Guild): Promise<void> {
        try {
            // check if guild exists in db & create banner
            const guildDoc = await GuildDbUtils.createGuild(guild);
            let banner = guildDoc.banner;
            if (!banner) {
                banner = await BannerUtils.createBanner(guild);
                await guild.client.shard.broadcastEval(broadcastBanner, {
                    context: { bannerUrl: banner, guildId: guild.id },
                });
            }
            // check if guild settings exist in db & if channels exists
            const guildSettings = await GuildSettingsDbUtils.getGuildSettings(guild.id);
            let categoryChannel: CategoryChannel;
            let systemChannel: GuildTextBasedChannel;
            if (!guildSettings) {
                const categoryChannel = await ChannelUtils.createParent(guild);
                const systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                const announcementChannel = await GuildUtils.findAnnouncementChannel(guild);
                await GuildSettingsDbUtils.createGuildSettings({
                    guildId: guild.id,
                    systemChannel,
                    categoryChannel,
                    announcementChannel,
                });
                const newGuildSettings = await GuildSettingsDbUtils.getGuildSettings(guild.id);
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

                const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(
                    newGuildSettings
                );
                if (newsChannels.length >= 5) {
                    return;
                }
                const newsChannel = await ChannelUtils.createNewsChannel(categoryChannel);
                await ChannelDbUtils.createGuildChannel(newGuildSettings, newsChannel);

                await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);

                return;
            }
            if (guildSettings.category_id)
                categoryChannel = guild.channels.cache.find(
                    channel => channel.id === guildSettings.category_id
                ) as CategoryChannel;
            if (guildSettings.system_id)
                systemChannel = guild.channels.cache.find(
                    channel => channel.id === guildSettings.system_id
                ) as GuildTextBasedChannel;
            if (!categoryChannel) {
                categoryChannel = await ChannelUtils.createParent(guild);
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: guild.id,
                    systemChannel: systemChannel,
                    categoryChannel: categoryChannel,
                });
            }
            if (categoryChannel && !systemChannel) {
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: guild.id,
                    systemChannel: systemChannel,
                });
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

            const referral = await GuildReferralDbUtils.getReferralByGuildId(guild.id);

            if (!referral.discord_user_id) {
                await systemChannel.send({
                    embeds: [SetupMessages.setupMessage4()],
                    components: [setupReferralButtons()],
                });
            }

            const newsChannels = await ChannelDbUtils.getAllNewsChannelsByGuild(guildSettings);
            if (newsChannels.length >= 5) {
                return;
            }
            const newsChannel = await ChannelUtils.createNewsChannel(categoryChannel);
            await ChannelDbUtils.createGuildChannel(guildSettings, newsChannel);

            await NewsChannelsUtils.sendLastThreeForGuild(newsChannel);
        } catch (err) {
            await Logger.error({
                message: `Error setting up guild: ${err.message || err}`,
                guildId: guild.id,
            });
        }
    }
}

export async function broadcastBanner(
    client: Client,
    { bannerUrl, guildId }: { bannerUrl: string; guildId: string }
): Promise<void> {
    client.emit('guildBanner', {
        bannerUrl,
        guildId,
    });
}
