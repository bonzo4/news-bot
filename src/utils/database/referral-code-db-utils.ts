import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type ReferralCode = Database['public']['Tables']['referral_codes']['Row'];

export default class ReferralCodeDbUtils {
    public static async getCodes(): Promise<ReferralCode[]> {
        const { data, error } = await supabase
            .from('ambassador_codes')
            .select()
            .order('last_accessed', { ascending: false })
            .limit(25);

        if (error || !data) return [];

        return data;
    }

    public static async getCodeByDiscordId(discordId: string): Promise<ReferralCode | null> {
        const { data, error } = await supabase
            .from('referral_codes')
            .select()
            .eq('discord_id', discordId)
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async getCodeByCode(code: string): Promise<ReferralCode | null> {
        const { data, error } = await supabase
            .from('referral_codes')
            .select()
            .eq('code', code)
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async createCode(discordId: string): Promise<ReferralCode> {
        const { data, error } = await supabase
            .from('referral_codes')
            .insert({
                discord_id: discordId,
            })
            .select()
            .single();

        if (error || !data) return null;

        return data;
    }
}
