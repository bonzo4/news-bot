import { CategoryChannel, Client, Guild, GuildTextBasedChannel } from 'discord.js';

import { EventHandler } from './index.js';
import { setupButtons } from '../buttons/setup-button-1.js';
import { SetupMessages } from '../messages/setup.js';
import { Logger } from '../services/index.js';
import {
    BannerUtils,
    ChannelUtils,
    GuildDbUtils,
    GuildSettingsDbUtils,
    GuildUtils,
} from '../utils/index.js';

export class GuildJoinHandler implements EventHandler {
    public async process(guild: Guild): Promise<void> {
        try {
            // check if guild exists in db & create banner
            const guildDoc = await GuildDbUtils.createGuild(guild);
            let banner = guildDoc.banner;
            if (!banner) banner = await BannerUtils.createBanner(guild);
            const createdAt = new Date(guildDoc.created_at);
            // check if guild is new
            if (createdAt.getTime() > Date.now() - 1000 * 60 * 60) {
                await guild.client.shard.broadcastEval(broadcastBanner, {
                    context: { bannerUrl: banner },
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
                await systemChannel.send({
                    embeds: [SetupMessages.setupStart(banner)],
                    components: [setupButtons()],
                });
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
                embeds: [SetupMessages.setupStart(banner)],
                components: [setupButtons()],
            });
        } catch (err) {
            await Logger.error({
                message: `Error setting up guild: ${err}`,
                guildId: guild.id,
            });
        }
    }
}

export async function broadcastBanner(
    client: Client,
    { bannerUrl }: { bannerUrl: string }
): Promise<void> {
    client.emit('guildBanner', {
        bannerUrl,
    });
}
