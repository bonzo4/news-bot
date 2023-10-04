import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

type DirectInteraction = Database['public']['Tables']['direct_interactions']['Row'];

type DirectInteractionInsert = Database['public']['Tables']['direct_interactions']['Insert'];

export class DirectInteractionDbUtils {
    public static async getInteractionsByUserIdAndDirectId(
        userId: string,
        directId: number
    ): Promise<DirectInteraction[]> {
        const { data, error } = await supabase
            .from('direct_interactions')
            .select()
            .eq('user_id', userId)
            .eq('direct_id', directId);

        if (error || !data) {
            return [];
        }

        return data;
    }

    public static async createInteraction(
        interaction: DirectInteractionInsert
    ): Promise<DirectInteraction> {
        const { data, error } = await supabase
            .from('direct_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
