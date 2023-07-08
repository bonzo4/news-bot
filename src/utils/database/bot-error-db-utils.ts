import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type BotError = Database['public']['Tables']['bot_errors']['Row'];
type BotErrorOptions = Database['public']['Tables']['bot_errors']['Insert'];

export class BotErrorDbUtils {
    public static async createError(options: BotErrorOptions): Promise<void> {
        const { error } = await supabase.from('bot_errors').insert(options);
        if (error) throw new Error(`Could not create bot error in database:\n${error.message}`);
    }
}
