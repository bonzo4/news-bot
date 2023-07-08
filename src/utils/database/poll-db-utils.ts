import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Poll = Database['public']['Tables']['polls']['Row'];

export class PollDbUtils {
    public static async getPollsByEmbedId(EmbedId: number): Promise<Poll[]> {
        const { data: poll, error } = await supabase.from('polls').select().eq('embed_id', EmbedId);
        if (error) return [];
        return poll;
    }

    public static async getPollById(id: number): Promise<Poll> {
        const { data: poll, error } = await supabase.from('polls').select().eq('id', id).single();
        if (error) return;
        return poll;
    }
}
