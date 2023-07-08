import { Channel } from 'discord.js';

import { EventHandler } from './index.js';
import { Logger } from '../services/logger.js';
import { GuildSettingsDbUtils } from '../utils/database/guild-settings-db-utils.js';
import { ChannelDbUtils } from '../utils/index.js';

export class ChannelDeleteHandler implements EventHandler {
    async process(channel: Channel): Promise<void> {
        try {
            let guildSettings = await GuildSettingsDbUtils.getGuildSettingsBySystemChannel(
                channel.id
            );
            if (guildSettings && !channel.isDMBased()) {
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: channel.guildId,
                    systemChannel: undefined,
                });
                Logger.info({ message: `Deleted guild category for ${channel.id}` });
                return;
            }
            guildSettings = await GuildSettingsDbUtils.getGuildSettingsByCategory(channel.id);
            if (guildSettings && !channel.isDMBased()) {
                await GuildSettingsDbUtils.updateGuildSettings({
                    guildId: channel.guildId,
                    categoryChannel: undefined,
                });
                Logger.info({ message: `Deleted guild system  for ${channel.id}` });
            }
            const newsChannel = await ChannelDbUtils.getNewsChannelById(channel.id);
            if (newsChannel) {
                await ChannelDbUtils.deleteNewsChannel(newsChannel);
                Logger.info({
                    message: `Deleted news channel ${channel.id} from database.`,
                    guildId: newsChannel.guild_id,
                });
            }
        } catch (error) {
            await Logger.error({
                message: `Something went wrong while processing channel delete:\n${error}`,
                guildId: channel.isDMBased() ? undefined : channel.guild.id,
            });
        }
    }
}
