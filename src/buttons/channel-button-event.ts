import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    channelMention,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { addChannelMenu } from '../menus/channel-add-menu-event.js';
import { removeChannelMenu } from '../menus/channel-remove-menu-event.js';
import { Logger } from '../services/logger.js';
import { ChannelDbUtils, GuildSettingsDbUtils, InteractionUtils } from '../utils/index.js';

export function channelButtons(): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`channel_add`)
                .setEmoji('⚫')
                .setLabel('Add a channel to receive news to.')
                .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`channel_remove`)
                .setEmoji('✖')
                .setLabel('Remove a channel from receiving news.')
                .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`channel_view`)
                .setEmoji('👀')
                .setLabel('View channels that will receive news.')
                .setStyle(ButtonStyle.Secondary)
        );
    return row;
}

export class ChannelButtons implements Button {
    ids = ['channel'];
    deferType = ButtonDeferType.REPLY;
    cooldown = new RateLimiter(1, 5000);
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: ButtonInteraction): Promise<void> {
        try {
            const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
            if (!guildSettings) {
                await InteractionUtils.warn(
                    intr,
                    'Please run `/setup` first before using this command.'
                );
                return;
            }
            switch (intr.customId.split('_')[1]) {
                case 'add': {
                    const addMenu = addChannelMenu();
                    await InteractionUtils.success(
                        intr,
                        'Please select the channel you would like to add.',
                        [addMenu]
                    );
                    break;
                }
                case 'remove': {
                    const removeMenu = removeChannelMenu();
                    await InteractionUtils.success(
                        intr,
                        'Please select the channel you would like to remove.',
                        [removeMenu]
                    );
                    break;
                }
                case 'view': {
                    const channels = await ChannelDbUtils.getAllNewsChannelsByGuild(guildSettings);
                    if (channels.length === 0) {
                        await InteractionUtils.warn(
                            intr,
                            'No channels are currently receiving news.'
                        );
                        return;
                    }
                    const channelsString = channels
                        .map(channel => channelMention(channel.id))
                        .join('\n🔊 ');
                    await InteractionUtils.send(
                        intr,
                        `Channels receiving news:\n🔊 ${channelsString}`
                    );
                    break;
                }
                default: {
                    await InteractionUtils.warn(intr, 'This button does not exist.');
                    break;
                }
            }
        } catch (error) {
            await InteractionUtils.error(
                intr,
                `There was an error managing your channels please contact a staff member.`
            );
            await Logger.error({
                message: `Error managing news: ${error.message ? error.message : error}`,
                guildId: intr.guild ? intr.guild.id : null,
                userId: intr.user.id,
            });
        }
    }
}
