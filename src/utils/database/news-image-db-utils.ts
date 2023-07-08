import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type NewsTracker = Database['public']['Tables']['news_trackers']['Row'];
type NewsTrackerOptions = Database['public']['Tables']['news_trackers']['Insert'];

export class NewsTrackerDbUtils {
    public static async createNewsTracker(
        options: NewsTrackerOptions
    ): Promise<NewsTracker | null> {
        const { data: newsImage, error } = await supabase
            .from('news_trackers')
            .insert(options)
            .select()
            .single();
        if (error) return null;
        return newsImage;
    }
}
