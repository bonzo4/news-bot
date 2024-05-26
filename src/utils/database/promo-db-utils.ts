import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Promo = Database['public']['Tables']['promo_buttons']['Row'];

export class PromoDbUtils {
    public static async getPromosByEmbedId(embedId: number): Promise<Promo[]> {
        const { data: promo, error } = await supabase
            .from('promo_buttons')
            .select()
            .eq('embed_id', embedId);
        if (error) return [];
        return promo;
    }

    public static async getPromoById(promoId: number): Promise<Promo> {
        const { data: promo, error } = await supabase
            .from('promo_buttons')
            .select()
            .eq('id', promoId)
            .single();
        if (error) return null;
        return promo;
    }
}
