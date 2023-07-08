import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type EmbedDoc = Database['public']['Tables']['news_embeds']['Row'];

export class EmbedDbUtils {
    public static async getEmbedsByNewsId(newsId: number): Promise<EmbedDoc[]> {
        const { data: embeds, error } = await supabase
            .from('news_embeds')
            .select('*')
            .eq('news_id', newsId);
        if (error) return [];
        return embeds.sort((a, b) => a.order - b.order);
    }

    public static async getEmbedById(id: number): Promise<EmbedDoc | null> {
        const { data: embed, error } = await supabase
            .from('news_embeds')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return embed;
    }
}
