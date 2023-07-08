import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Link = Database['public']['Tables']['links']['Row'];

export class LinkDbUtils {
    public static async getLinksByEmbedId(embedId: number): Promise<Link[]> {
        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .eq('embed_id', embedId);
        if (error) return [];
        return links;
    }

    public static async getLinkById(id: number): Promise<Link | null> {
        const { data: link, error } = await supabase.from('links').select('*').eq('id', id);
        if (error) return null;
        return link[0];
    }
}
