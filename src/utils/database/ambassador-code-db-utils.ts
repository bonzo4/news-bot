import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type AmbassadorCode = Database['public']['Tables']['ambassador_codes']['Row'];

export class AmbassadorCodeDbUtils {
    public static async getCodes(): Promise<AmbassadorCode[]> {
        const { data, error } = await supabase
            .from('ambassador_codes')
            .select()
            .order('last_accessed', { ascending: false })
            .neq('last_accessed', null)
            .neq('last_accessed', null)
            .limit(25);

        if (error || !data) return [];

        return data;
    }

    public static async getCodeByDiscordId(discordId: string): Promise<AmbassadorCode | null> {
        const { data, error } = await supabase
            .from('ambassador_codes')
            .select()
            .eq('discord_id', discordId)
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async getCodeByCode(code: string): Promise<AmbassadorCode | null> {
        const { data, error } = await supabase
            .from('ambassador_codes')
            .select()
            .eq('code', code)
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async createCode(discordId: string, code: string): Promise<void> {
        await supabase.from('ambassador_codes').insert([
            {
                discord_id: discordId,
                code,
            },
        ]);
    }
}
