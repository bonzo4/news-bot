import { CommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { channelButtons } from '../../buttons/channel-button-event.js';
import { GuildSettingsDbUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class ChannelCommand implements Command {
    names = ['channel'];
    requireAdmin = true;
    requireGuild = true;
    requireClientPerms = [] as PermissionsString[];
    cooldown = new RateLimiter(1, 5000);
    deferType = CommandDeferType.HIDDEN;

    async execute(intr: CommandInteraction): Promise<void> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
        if (!guildSettings) {
            await InteractionUtils.warn(intr, `Please run the **/setup** command first.`);
            return;
        }

        const buttons = channelButtons();
        await InteractionUtils.success(intr, `🔊┃**Manage NewsChannels**:\n\n`, [buttons]);
    }
}
