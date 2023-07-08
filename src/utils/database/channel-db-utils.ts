import { DMChannel, TextChannel } from 'discord.js';

import { GuildSettings } from './guild-settings-db-utils.js';
import { supabase } from './index.js';
import { BotError } from '../../extensions/BotError.js';
import { Database } from '../../types/supabase.js';

export type NewsChannel = Database['public']['Tables']['news_channels']['Row'];
export type DirectChannel = Database['public']['Tables']['direct_channels']['Row'];

export class ChannelDbUtils {
    public static async createGuildChannel(
        guildSettings: GuildSettings,
        newsChannel: TextChannel
    ): Promise<void> {
        const { error } = await supabase.from('news_channels').insert({
            id: newsChannel.id,
            guild_id: guildSettings.guild_id,
        });
        if (error) throw new Error(error.message);
    }

    public static async createDirectChannel(userId: string, dmChannel: DMChannel): Promise<void> {
        const { error } = await supabase.from('direct_channels').insert({
            id: dmChannel.id,
            user_id: userId,
        });
        if (error) throw new Error(error.message);
    }

    public static async getNewsChannelById(channelId: string): Promise<NewsChannel | null> {
        const { data: channel, error } = await supabase
            .from('news_channels')
            .select('*')
            .eq('id', channelId)
            .single();
        if (error) return null;
        return channel;
    }

    public static async getDirectChannelById(channelId: string): Promise<DirectChannel | null> {
        const { data: channel, error } = await supabase
            .from('direct_channels')
            .select('*')
            .eq('id', channelId)
            .single();
        if (error) return null;
        return channel;
    }

    public static async getDirectNewsChannel(userId: string): Promise<DirectChannel | null> {
        const { data: channel, error } = await supabase
            .from('direct_channels')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) return null;
        return channel;
    }

    public static async getAllDirectNewsChannels(): Promise<DirectChannel[]> {
        const { data: channels, error } = await supabase.from('direct_channels').select('*');
        if (error) return [];
        return channels;
    }

    public static async getAllNewsChannelsByGuild(
        guildSettings: GuildSettings
    ): Promise<NewsChannel[]> {
        const { data: channels, error } = await supabase
            .from('news_channels')
            .select('*')
            .eq('guild_id', guildSettings.guild_id);
        if (error) return [];
        return channels;
    }

    public static async deleteNewsChannel(channel: NewsChannel): Promise<void> {
        const { error } = await supabase.from('news_channels').delete().eq('id', channel.id);
        if (error) throw new Error(error.message);
    }

    public static async deleteDirectChannel(channel: DirectChannel): Promise<void> {
        const { error } = await supabase.from('direct_channels').delete().eq('id', channel.id);
        if (error)
            throw new BotError({
                ...error,
                reply: 'There was an error unsubscribing you from Syndicate Direct. Please try again later.',
            });
    }
}
