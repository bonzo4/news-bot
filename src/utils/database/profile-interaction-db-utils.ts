import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type ProfileInteraction = Database['public']['Tables']['profile_interactions']['Row'];

type ProfileInteractionInsert = Database['public']['Tables']['profile_interactions']['Insert'];

export class ProfileInteractionDbUtils {
    public static async getInteractionsByUserIdAndProfileId(
        userId: string,
        profileId: number
    ): Promise<ProfileInteraction[]> {
        const { data, error } = await supabase
            .from('profile_interactions')
            .select()
            .eq('user_id', userId)
            .eq('profile_id', profileId);

        if (error || !data) {
            return [];
        }

        return data;
    }

    public static async createInteraction(
        interaction: ProfileInteractionInsert
    ): Promise<ProfileInteraction> {
        const { data, error } = await supabase
            .from('profile_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
