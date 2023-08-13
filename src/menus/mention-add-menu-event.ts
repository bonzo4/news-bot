import {
    ActionRowBuilder,
    Role,
    RoleSelectMenuInteraction,
    StringSelectMenuBuilder,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { GuildSettingsDbUtils, InteractionUtils, MentionDbUtils } from '../utils/index.js';

export function addMentionMenu(roles: Role[]): ActionRowBuilder<StringSelectMenuBuilder> {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>();
    const menu = new StringSelectMenuBuilder()
        .setCustomId('mentionAdd')
        .setPlaceholder('Select a role to mention.')
        .setMinValues(1)
        .setMaxValues(1);
    roles
        .sort((a, b) => b.members.size - a.members.size)
        .slice(0, 25)
        .forEach(role => {
            menu.addOptions([
                {
                    label: role.name,
                    value: role.id,
                    emoji: role.iconURL() ? role.iconURL() : undefined,
                },
            ]);
        });
    row.addComponents(menu);
    return row;
}

export class MentionAddMenu implements Menu {
    public ids = ['mentionAdd'];
    public cooldown = new RateLimiter(1, 5000);
    deferType = MenuDeferType.REPLY;
    requireGuild = true;
    requireAdmin = true;

    async execute(intr: RoleSelectMenuInteraction): Promise<void> {
        const guildSettings = await GuildSettingsDbUtils.getGuildSettings(intr.guildId);
        if (!guildSettings) {
            await InteractionUtils.warn(
                intr,
                'Please run `/setup` first before using this command.'
            );
            return;
        }
        const roleId = intr.values[0];
        if (!roleId) {
            await InteractionUtils.warn(intr, 'Please select a role.');
            return;
        }
        const role = intr.guild.roles.cache.get(roleId);
        if (!role) {
            await InteractionUtils.warn(intr, `Role not found.`);
            return;
        }
        const mentionDoc = await MentionDbUtils.getMentionRole(role);
        if (mentionDoc) {
            await InteractionUtils.warn(intr, `Role is already being mentioned.`);
            return;
        }
        await MentionDbUtils.createMentionRole(guildSettings, role);
        await InteractionUtils.success(intr, `${role.toString()} mention added.`);
    }
}
