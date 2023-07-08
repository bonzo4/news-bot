import { Guild } from 'discord.js';
import { createRequire } from 'node:module';

import { EventHandler } from './index.js';
import { Logger } from '../services/index.js';
import { GuildDbUtils, GuildSettingsDbUtils } from '../utils/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class GuildLeaveHandler implements EventHandler {
    public async process(guild: Guild): Promise<void> {
        try {
            Logger.info({
                message: Logs.info.guildLeft
                    .replaceAll('{GUILD_NAME}', guild.name)
                    .replaceAll('{GUILD_ID}', guild.id),
                guildId: guild.id,
            });
            await GuildDbUtils.updateLeftGuild(guild);
            await GuildSettingsDbUtils.deleteGuildSettings(guild.id);
        } catch (error) {
            await Logger.error({
                message: `Something went wrong while processing guild leave:\n${error}`,
                guildId: guild.id,
            });
        }
    }
}
