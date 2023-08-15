import {
    ActionRowBuilder,
    Guild,
    RoleSelectMenuInteraction,
    StringSelectMenuBuilder,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Menu, MenuDeferType } from './menu.js';
import { Database } from '../types/supabase.js';
import { GuildSettingsDbUtils, InteractionUtils, MentionDbUtils } from '../utils/index.js';

type RoleDoc = Database['public']['Tables']['mention_roles']['Row'];

export async function removeMentionMenu(
    guild: Guild,
    roleDocs: RoleDoc[]
): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>();

    const menu = new StringSelectMenuBuilder()
        .setCustomId('mentionRemove')
        .setPlaceholder('Select a role to remove mention.')
        .setMinValues(1)
        .setMaxValues(1);
    for (const roleDoc of roleDocs) {
        const role = guild.roles.cache.get(roleDoc.id);
        if (role) {
            menu.addOptions([
                {
                    label: role.name,
                    value: role.id,
                },
            ]);
        } else {
            await MentionDbUtils.deleteMentionRole(roleDoc.id).catch(err => console.error(err));
        }
    }
    row.addComponents(menu);
    return row;
}

export class MentionRemoveMenu implements Menu {
    public ids = ['mentionRemove'];
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
        if (!mentionDoc) {
            await InteractionUtils.warn(intr, `Role is not being mentioned.`);
            return;
        }
        await MentionDbUtils.deleteMentionRole(role.id);
        await InteractionUtils.success(intr, `${role.toString()} mention deleted.`);
    }
}
