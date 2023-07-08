import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Promo = Database['public']['Tables']['promos']['Row'];

export class PromoDbUtils {
    public static async getPromosByEmbedId(embedId: number): Promise<Promo[]> {
        const { data: promo, error } = await supabase
            .from('promos')
            .select()
            .eq('embed_id', embedId);
        if (error) return [];
        return promo;
    }
}
