import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Tag = Database['public']['Tables']['tags']['Row'];

export class TagDbUtils {
    public static async getTagsByNewsId(newsId: number): Promise<Tag[]> {
        const { data: newsTags, error } = await supabase
            .from('_news_tags')
            .select('tag')
            .eq('news_id', newsId);
        if (!error) {
            const { data: tags, error } = await supabase
                .from('tags')
                .select('*')
                .in(
                    'name',
                    newsTags.map(t => t.tag)
                );
            if (error) throw error.message;
            return tags;
        }
        throw error.message;
    }

    public static async getAllTags(): Promise<Tag[]> {
        const { data: tags, error } = await supabase.from('tags').select('*');
        if (error) throw error.message;
        return tags;
    }

    public static async getAllGuildTags(guildId: string): Promise<string[]> {
        const { data: tags, error } = await supabase
            .from('_guild_tags')
            .select('tag')
            .eq('guild_id', guildId);
        if (error) return [];
        return tags.map(t => t.tag);
    }

    public static async getAllUserTags(userId: string): Promise<string[]> {
        const { data: tags, error } = await supabase
            .from('_user_tags')
            .select('tag')
            .eq('user_id', userId);
        if (error) return [];
        return tags.map(t => t.tag);
    }

    public static async getGuildsWithTags(tags: Tag[], guildIds: string[]): Promise<string[]> {
        const guildsWithTags: string[] = [];
        for (const guildId of guildIds) {
            const { data: tagNames, error } = await supabase
                .from('_guild_tags')
                .select('tag')
                .eq('guild_id', guildId)
                .in(
                    'tag',
                    tags.map(tag => tag.name)
                );
            if (!error && tagNames.length > 0) {
                guildsWithTags.push(guildId);
            }
        }
        return guildsWithTags;
    }

    public static async getUsersWithTags(tags: Tag[]): Promise<string[]> {
        const usersWithTags: string[] = [];
        for (const tag of tags) {
            const { data: userIds, error } = await supabase
                .from('_user_tags')
                .select('user_id')
                .eq('tag', tag.name);
            if (!error && userIds.length > 0) {
                usersWithTags.push(...userIds.map(u => u.user_id));
            }
        }
        return usersWithTags;
    }

    public static async addNewsTag(newsId: number, tag: string, schedule: string): Promise<void> {
        const { error } = await supabase
            .from('_news_tags')
            .insert({ tag, news_id: newsId, schedule: schedule });
        if (error) throw error.message;
    }

    public static async addGuildTag(guildId: string, tag: string): Promise<void> {
        const { error } = await supabase.from('_guild_tags').insert({ tag, guild_id: guildId });
        if (error) throw error.message;
    }
}
