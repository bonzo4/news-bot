import {
    CategoryChannel,
    CommandInteraction,
    GuildTextBasedChannel,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { setupButtons } from '../../buttons/setup/setup-button-1.js';
import { SetupMessages } from '../../messages/setup.js';
import { Logger } from '../../services/logger.js';
import {
    BannerUtils,
    ChannelUtils,
    GuildDbUtils,
    GuildSettingsDbUtils,
    GuildUtils,
    InteractionUtils,
} from '../../utils/index.js';
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
            const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
            let categoryChannel: CategoryChannel;
            let systemChannel: GuildTextBasedChannel;
            if (!guildSettings) {
                categoryChannel = await ChannelUtils.createParent(intr.guild);
                systemChannel = await ChannelUtils.createSystemChannel(categoryChannel);
                const announcementChannel = await GuildUtils.findAnnouncementChannel(intr.guild);
                await GuildSettingsDbUtils.createGuildSettings({
                    guildId: intr.guildId,
                    systemChannel,
                    categoryChannel,
                    announcementChannel,
                });
                await systemChannel.send({
                    embeds: [SetupMessages.setupStart(banner)],
                    components: [setupButtons()],
                });

                await InteractionUtils.success(
                    intr,
                    `Setup has been completed. Please check ${systemChannel.toString()} for more information.`
                );
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
                embeds: [SetupMessages.setupStart(banner)],
                components: [setupButtons()],
            });

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
