import {
    ActionRowBuilder,
    roleMention,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { GuildSettingsDbUtils, InteractionUtils, MentionDbUtils } from '../utils/index.js';

export function addMentionMenu(): ActionRowBuilder<RoleSelectMenuBuilder> {
    const row = new ActionRowBuilder<RoleSelectMenuBuilder>();
    const menu = new RoleSelectMenuBuilder()
        .setCustomId(`mentionAdd`)
        .setPlaceholder('Select a Role');
    row.addComponents([menu]);
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
        await InteractionUtils.success(intr, `${roleMention(role.id)} mention added.`);
    }
}
