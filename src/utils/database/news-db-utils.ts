import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type DiscordNews = Database['public']['Tables']['discord_news']['Row'];

export class NewsDbUtils {
    public static async getNews(newsId: number): Promise<DiscordNews> {
        const { data: news, error } = await supabase
            .from('discord_news')
            .select('*')
            .eq('id', newsId)
            .single();
        if (error) throw new Error(`Could not get news from database:\n${error.message}`);
        if (!news) throw new Error(`Could not get news from database`);
        return news;
    }

    public static async getScheduledNews(): Promise<DiscordNews[]> {
        // get news that is scheduled for the next 24 hours
        const now = new Date();
        // get 6 hours from now
        const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

        const { data: news, error } = await supabase
            .from('discord_news')
            .select('*')
            .gte('schedule', now.toISOString())
            .lte('schedule', sixHoursFromNow.toISOString())
            .order('schedule', { ascending: true });
        if (error) throw new Error(`Could not get news from database:\n${error.message}`);
        return news;
    }

    public static async getUnapprovedNews(): Promise<DiscordNews[]> {
        // get unapproved news from the last week
        const { data: news, error } = await supabase
            .from('discord_news')
            .select('*')
            .eq('approved', false)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        if (error) throw new Error(`Could not get news from database:\n${error.message}`);
        return news;
    }

    public static async getLastThreeGuildApprovedNews(): Promise<DiscordNews[]> {
        const { data: tagDocs, error: tagError } = await supabase
            .from('_news_tags')
            .select('news_id')
            .in('tag', ['news'])
            .order('news_id', { ascending: false })
            .limit(3);
        if (tagError) return [];
        const { data: news, error: newsError } = await supabase
            .from('discord_news')
            .select('*')
            .eq('approved', true)
            .in(
                'id',
                tagDocs.map(tag => tag.news_id)
            );
        if (newsError) return [];
        return news;
    }

    public static async getLastThreeDirectApprovedNews(): Promise<DiscordNews[]> {
        const { data: tags, error: tagError } = await supabase
            .from('_news_tags')
            .select('news_id')
            .in('tag', ['news'])
            .order('news_id', { ascending: false })
            .limit(3);
        if (tagError) return [];
        const { data: news, error: newsError } = await supabase
            .from('discord_news')
            .select('*')
            .eq('approved', true)
            .in(
                'id',
                tags.map(tag => tag.news_id)
            );
        if (newsError) return [];
        return news;
    }

    public static async approveNews(newsId: number): Promise<void> {
        const { error } = await supabase
            .from('discord_news')
            .update({ approved: true, approved_at: new Date().toISOString() })
            .eq('id', newsId);
        if (error) throw new Error(`Could not approve news in database:\n${error.message}`);
    }
}
