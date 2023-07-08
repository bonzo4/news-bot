import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Input = Database['public']['Tables']['inputs']['Row'];

export class InputDbUtils {
    public static async getInputsByEmbedId(embedId: number): Promise<Input[]> {
        const { data: input, error } = await supabase
            .from('inputs')
            .select()
            .eq('embed_id', embedId);
        if (error) return [];
        return input;
    }

    public static async getInputById(inputId: number): Promise<Input | null> {
        const { data: input, error } = await supabase
            .from('inputs')
            .select()
            .eq('id', inputId)
            .single();
        if (error) return null;
        return input;
    }
}
