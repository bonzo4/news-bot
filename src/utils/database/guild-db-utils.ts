import { Guild } from 'discord.js';

import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';
import { GuildUtils } from '../guild-utils.js';

export type GuildDoc = Database['public']['Tables']['guilds']['Row'];

export class GuildDbUtils {
    public static async getGuild(guild: Guild): Promise<GuildDoc | null> {
        const { data: guildDoc, error } = await supabase
            .from('guilds')
            .select('*')
            .eq('id', guild.id)
            .single();
        if (error) return null;
        return guildDoc;
    }

    public static async getGuildById(guildId: string): Promise<GuildDoc | null> {
        const { data: guildDoc, error } = await supabase
            .from('guilds')
            .select('*')
            .eq('id', guildId)
            .single();
        if (error) return null;
        return guildDoc;
    }

    public static async createGuild(guild: Guild): Promise<GuildDoc> {
        const invite = await GuildUtils.getInvite(guild);

        const { data: guildDoc, error } = await supabase
            .from('guilds')
            .upsert({
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                member_count: guild.memberCount,
                joined_at: guild.members.me.joinedAt.toISOString(),
                left_at: null,
                invite,
            })
            .select()
            .single();
        if (error) throw new Error(`Could not create guild(${guild.id}): ${error.message}`);
        return guildDoc;
    }

    public static async updateGuildBanner(guild: Guild, banner: string): Promise<void> {
        const guildDoc = await this.getGuild(guild);
        if (!guildDoc) return;
        const { error } = await supabase.from('guilds').update({ banner }).eq('id', guild.id);
        if (error) throw new Error(`Could not update guild(${guild.id}) banner: ${error.message}`);
    }

    public static async updateGuild(guild: Guild): Promise<void> {
        const { error } = await supabase
            .from('guilds')
            .update({
                name: guild.name,
                icon: guild.iconURL(),
                member_count: guild.memberCount,
            })
            .eq('id', guild.id);
        if (error) throw new Error(`Could not update guild(${guild.id}): ${error.message}`);
    }

    public static async updateLeftGuild(guild: Guild): Promise<void> {
        let invite: string | null = null;
        const guildDoc = await this.getGuild(guild);
        if (!guildDoc) return;
        if (!guildDoc.invite) invite = await GuildUtils.getInvite(guild);
        const { error } = await supabase
            .from('guilds')
            .update({
                name: guild.name,
                icon: guild.iconURL(),
                member_count: guild.memberCount,
                left_at: new Date().toISOString(),
                invite,
            })
            .eq('id', guild.id);
        if (error) throw new Error(`Could not update guild(${guild.id}): ${error.message}`);
    }

    public static async updateBanner(guild: Guild, banner: string): Promise<void> {
        const { error } = await supabase.from('guilds').update({ banner }).eq('id', guild.id);
        if (error) throw new Error(`Could not update guild(${guild.id}) banner: ${error.message}`);
    }
}
