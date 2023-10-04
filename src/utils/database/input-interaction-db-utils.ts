import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type InputInteraction = Database['public']['Tables']['input_interactions']['Row'];

type InputInteractionInsert = Database['public']['Tables']['input_interactions']['Insert'];

export class InputInteractionDbUtils {
    public static async getInteractionsByUserIdAndInputId(
        userId: string,
        inputId: number
    ): Promise<InputInteraction[]> {
        const { data, error } = await supabase
            .from('input_interactions')
            .select()
            .eq('user_id', userId)
            .eq('input_id', inputId);

        if (error || !data) {
            return null;
        }

        return data;
    }

    public static async createInteraction(
        interaction: InputInteractionInsert
    ): Promise<InputInteraction> {
        const { data, error } = await supabase
            .from('input_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
