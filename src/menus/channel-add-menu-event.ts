import {
    ActionRowBuilder,
    ChannelSelectMenuInteraction,
    GuildTextBasedChannel,
    StringSelectMenuBuilder,
    TextChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { ChannelDbUtils, GuildSettingsDbUtils, InteractionUtils } from '../utils/index.js';

export function addChannelMenu(
    channels: GuildTextBasedChannel[]
): ActionRowBuilder<StringSelectMenuBuilder> {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>();
    const menu = new StringSelectMenuBuilder()
        .setCustomId('channelAdd')
        .setPlaceholder('Select a channel to add.')
        .setMinValues(1)
        .setMaxValues(1);
    channels.splice(0, 25).forEach(channel => {
        menu.addOptions([
            {
                label: channel.name,
                value: channel.id,
            },
        ]);
    });
    row.addComponents(menu);
    return row;
}

export class ChannelAddMenu implements Menu {
    public ids = ['channelAdd'];
    public cooldown = new RateLimiter(1, 5000);
    deferType = MenuDeferType.REPLY;
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: ChannelSelectMenuInteraction): Promise<void> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
        if (!guildSettings) {
            await InteractionUtils.warn(
                intr,
                'Please run `/setup` first before using this command.'
            );
            return;
        }
        const channelId = intr.values[0];
        if (!channelId) {
            await InteractionUtils.warn(intr, 'Please select a channel.');
            return;
        }
        const channel = intr.guild.channels.cache.get(channelId);
        if (!channel) {
            await InteractionUtils.warn(intr, `Channel not found.`);
            return;
        }
        if (!channel.isTextBased()) {
            await InteractionUtils.warn(intr, `Channel must be a text channel.`);
            return;
        }
        const channelDoc = await ChannelDbUtils.getNewsChannelById(channel.id);
        if (channelDoc) {
            await InteractionUtils.warn(intr, `Channel is already a news channel.`);
            return;
        }
        await ChannelDbUtils.createGuildChannel(guildSettings, channel as TextChannel);
        await InteractionUtils.success(intr, `${channel.toString()} Channel added.`);
    }
}
