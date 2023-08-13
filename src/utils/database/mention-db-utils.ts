import { Role } from 'discord.js';

import { GuildSettings } from './guild-settings-db-utils.js';
import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type MentionRole = Database['public']['Tables']['mention_roles']['Row'];

export class MentionDbUtils {
    public static async createMentionRole(
        guildSettings: GuildSettings,
        mentionRole: Role
    ): Promise<void> {
        const { error } = await supabase.from('mention_roles').insert({
            id: mentionRole.id,
            guild_id: guildSettings.guild_id,
        });
        if (error) throw new Error(`Could not create mention role in database:\n${error.message}`);
    }

    public static async getMentionRole(role: Role): Promise<MentionRole | null> {
        const { data: mentionRole, error } = await supabase
            .from('mention_roles')
            .select('*')
            .eq('id', role.id)
            .single();
        if (error) return null;
        return mentionRole;
    }

    public static async getAllMentionRolesByGuild(
        guildSettings: GuildSettings
    ): Promise<MentionRole[]> {
        const { data: mentionRoles, error } = await supabase
            .from('mention_roles')
            .select('*')
            .eq('guild_id', guildSettings.guild_id);
        if (error) throw new Error(`Could not get mention roles from database:\n${error.message}`);
        return mentionRoles;
    }

    public static async deleteMentionRole(roleId: string): Promise<void> {
        const { error } = await supabase.from('mention_roles').delete().eq('id', roleId);
        if (error)
            throw new Error(`Could not delete mention role from database:\n${error.message}`);
    }
}
