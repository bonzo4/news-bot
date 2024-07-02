import { CategoryChannel, TextChannel } from 'discord.js';

import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type GuildSettings = Database['public']['Tables']['guild_settings']['Row'];

interface GuildSettingsOptions {
    guildId: string;
    categoryChannel: CategoryChannel;
    systemChannel?: TextChannel;
    announcementChannel?: TextChannel;
}

interface UpdateGuildSettingsOptions {
    guildId: string;
    categoryChannel?: CategoryChannel;
    systemChannel?: TextChannel;
    announcementChannel?: TextChannel;
}

export class GuildSettingsDbUtils {
    public static async getGuildSettings(guildId: string): Promise<GuildSettings | null> {
        const { data: guildSettings, error } = await supabase
            .from('guild_settings')
            .select('*')
            .eq('guild_id', guildId)
            .single();
        if (error) return null;
        return guildSettings;
    }

    public static async getGuildSettingsByCategory(
        categoryId: string
    ): Promise<GuildSettings | null> {
        const { data: guildSettings, error } = await supabase
            .from('guild_settings')
            .select('*')
            .eq('category_id', categoryId)
            .single();
        if (error) return null;
        return guildSettings;
    }

    public static async getGuildSettingsBySystemChannel(
        systemId: string
    ): Promise<GuildSettings | null> {
        const { data: guildSettings, error } = await supabase
            .from('guild_settings')
            .select('*')
            .eq('system_id', systemId)
            .single();
        if (error) return null;
        return guildSettings;
    }

    public static async createGuildSettings(options: GuildSettingsOptions): Promise<GuildSettings> {
        const { data, error } = await supabase
            .from('guild_settings')
            .insert({
                guild_id: options.guildId,
                category_id: options.categoryChannel.id,
                system_id: options.systemChannel?.id,
            })
            .select('*')
            .single();
        if (error) throw new Error(error.message);
        return data;
    }

    public static async updateGuildSettings(options: UpdateGuildSettingsOptions): Promise<void> {
        const { guildId, categoryChannel, systemChannel } = options;
        const { error } = await supabase
            .from('guild_settings')
            .update({
                category_id: categoryChannel ? categoryChannel.id : null,
                system_id: systemChannel ? systemChannel.id : null,
            })
            .eq('guild_id', guildId);
        if (error) throw new Error(error.message);
    }

    public static async deleteGuildSettings(guildId: string): Promise<void> {
        const { error } = await supabase.from('guild_settings').delete().eq('guild_id', guildId);
        if (error) throw new Error(error.message);
    }
}
