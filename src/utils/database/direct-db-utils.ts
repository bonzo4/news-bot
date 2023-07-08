import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Direct = Database['public']['Tables']['directs']['Row'];

export class DirectDbUtils {
    public static async getDirectsByEmbedId(embedId: number): Promise<Direct[]> {
        const { data: quiz, error } = await supabase
            .from('directs')
            .select()
            .eq('embed_id', embedId);
        if (error) return [];
        return quiz;
    }

    public static async getDirectById(id: number): Promise<Direct | null> {
        const { data: direct, error } = await supabase
            .from('directs')
            .select()
            .eq('id', id)
            .single();
        if (error) return null;
        return direct;
    }
}
