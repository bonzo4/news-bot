import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

type DiscordAction = Database['public']['Tables']['discord_actions']['Row'];

export default class DiscordActionDbUtils {
    public static async getPointsByUserId(userId: string): Promise<number> {
        const { data, error } = await supabase.rpc('get_total_user_points', {
            discord_user_id: userId,
        });

        if (error || !data) return 0;

        return data;
    }

    public static async getLastActionsByUserId(userId: string): Promise<DiscordAction[]> {
        const { data, error } = await supabase
            .from('discord_actions')
            .select()
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !data) return [];

        return data;
    }

    public static async getFavoriteGuild(userId: string): Promise<string | null> {
        const { data, error } = await supabase.rpc('get_favorite_guild', {
            discord_user_id: userId,
        });

        if (error || !data) return null;

        return data;
    }
}
