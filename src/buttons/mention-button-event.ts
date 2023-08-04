import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    roleMention,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Button, ButtonDeferType } from './button.js';
import { addMentionMenu } from '../menus/mention-add-menu-event.js';
import { removeMentionMenu } from '../menus/mention-remove-menu-event.js';
import { Logger } from '../services/logger.js';
import { GuildSettingsDbUtils, InteractionUtils, MentionDbUtils } from '../utils/index.js';

export function mentionButtons(): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`mention_add`)
                .setEmoji('⚫')
                .setLabel('Add a role to mention when news is posted.')
                .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`mention_remove`)
                .setEmoji('✖')
                .setLabel('Remove a role from being mentioned when news is posted.')
                .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`mention_view`)
                .setEmoji('👀')
                .setLabel('View roles that will be mentioned when news is posted.')
                .setStyle(ButtonStyle.Secondary)
        );
    return row;
}

export class MentionButtons implements Button {
    ids = ['mention'];
    deferType = ButtonDeferType.REPLY;
    requireGuild = true;
    requireEmbedAuthorTag = false;
    requireClientPerms = [];
    cooldown = new RateLimiter(1, 5000);
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
                    const addMenu = addMentionMenu();
                    await InteractionUtils.success(
                        intr,
                        'Please select the role you would like to add.',
                        [addMenu]
                    );
                    break;
                }
                case 'remove': {
                    const removeMenu = removeMentionMenu();
                    await InteractionUtils.success(
                        intr,
                        'Please select the role you would like to remove.',
                        [removeMenu]
                    );
                    break;
                }
                case 'view': {
                    const mentionRoles = await MentionDbUtils.getAllMentionRolesByGuild(
                        guildSettings
                    );
                    if (mentionRoles.length === 0) {
                        await InteractionUtils.warn(
                            intr,
                            'There are currently no roles to be mentioned.'
                        );
                        return;
                    }
                    const mentionString = mentionRoles
                        .map(channel => roleMention(channel.id))
                        .join('\n📢 ');
                    await InteractionUtils.send(
                        intr,
                        `Roles to be mentioned:\n📢 ${mentionString}`
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
