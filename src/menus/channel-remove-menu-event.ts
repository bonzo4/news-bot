import {
    ActionRowBuilder,
    ChannelSelectMenuInteraction,
    Guild,
    StringSelectMenuBuilder,
    TextChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { Database } from '../types/supabase.js';
import { ChannelDbUtils, GuildSettingsDbUtils, InteractionUtils } from '../utils/index.js';

type ChannelDoc = Database['public']['Tables']['news_channels']['Row'];

export function removeChannelMenu(
    guild: Guild,
    channelDocs: ChannelDoc[]
): ActionRowBuilder<StringSelectMenuBuilder> {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>();
    const menu = new StringSelectMenuBuilder()
        .setCustomId('channelRemove')
        .setPlaceholder('Select a channel to remove.')
        .setMinValues(1)
        .setMaxValues(1);
    channelDocs.forEach(channelDoc => {
        const channel = guild.channels.cache.get(channelDoc.id);
        if (!channel) return;
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

export class ChannelRemoveMenu implements Menu {
    public ids = ['channelRemove'];
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
        const channelDoc = await ChannelDbUtils.getNewsChannelById(channel.id);
        if (!channelDoc) {
            await InteractionUtils.warn(intr, `Channel is not a news channel.`);
            return;
        }
        await ChannelDbUtils.createGuildChannel(guildSettings, channel as TextChannel);
        await InteractionUtils.success(intr, `${channel.toString()} Channel removed.`);
    }
}
