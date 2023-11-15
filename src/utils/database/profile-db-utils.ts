import { supabase } from './index.js';
import { UserDoc } from './user-db-utils.js';
import { Database } from '../../types/supabase.js';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export default class ProfileDbUtils {
    public static async getProfileByDiscordId(discordId: string): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('discord_id', discordId)
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async createProfile(discordUser: UserDoc, points: number = 0): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                icon: discordUser.icon,
                name: discordUser.name,
                discord_id: discordUser.id,
                points,
            })
            .select('*')
            .single();

        if (error || !data) return null;

        return data;
    }

    public static async updateSolWallet(profileId: string, solWallet: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ sol_wallet: solWallet })
            .eq('id', profileId);

        if (error) throw error;
    }

    public static async updateEthWallet(profileId: string, ethWallet: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ eth_wallet: ethWallet })
            .eq('id', profileId);

        if (error) throw error;
    }
}
