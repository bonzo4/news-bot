import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type PollInteraction = Database['public']['Tables']['poll_interactions']['Row'];

type PollInteractionInsert = Database['public']['Tables']['poll_interactions']['Insert'];

export class PollInteractionDbUtils {
    public static async getVoteCountByUserId(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('poll_interactions')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .not('poll_choice_id', 'is', null);

        if (error || !count) {
            return 0;
        }

        return count;
    }

    public static async getInteractionsByUserIdAndPollId(
        userId: string,
        pollId: number
    ): Promise<PollInteraction[] | null> {
        const { data, error } = await supabase
            .from('poll_interactions')
            .select()
            .eq('user_id', userId)
            .eq('poll_id', pollId);

        if (error || !data) {
            return [];
        }

        return data;
    }

    public static async createInteraction(
        interaction: PollInteractionInsert
    ): Promise<PollInteraction> {
        const { data, error } = await supabase
            .from('poll_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
