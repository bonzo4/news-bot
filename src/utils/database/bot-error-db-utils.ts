import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type BotError = Database['public']['Tables']['bot_errors']['Row'];
type BotErrorOptions = Database['public']['Tables']['bot_errors']['Insert'];

export class BotErrorDbUtils {
    public static async createError(options: BotErrorOptions): Promise<void> {
        const guildDoc = await supabase.from('guilds').select('id').eq('id', options.guild_id);
        if (!guildDoc) options.guild_id = null;
        const userDoc = await supabase.from('discord_users').select('id').eq('id', options.user_id);
        if (!userDoc) options.user_id = null;
        const newsDoc = await supabase.from('news').select('id').eq('id', options.news_id);
        if (!newsDoc) options.news_id = null;
        const { error } = await supabase.from('bot_errors').insert(options);
        if (error) throw new Error(`Could not create bot error in database:\n${error.message}`);
    }
}
