import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type PromoInteraction = Database['public']['Tables']['promo_interactions']['Row'];

type PromoInteractionInsert = Database['public']['Tables']['promo_interactions']['Insert'];

export class PromoInteractionDbUtils {
    public static async createInteraction(
        interaction: PromoInteractionInsert
    ): Promise<PromoInteraction> {
        const { data, error } = await supabase
            .from('promo_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
