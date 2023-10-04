import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type InteractionDoc = Database['public']['Tables']['interactions']['Row'];

type InteractionOptions = Database['public']['Tables']['interactions']['Insert'];

export class InteractionDbUtils {
    public static async getInteractionByUserIdAndPollId(
        userId: string,
        pollId: number
    ): Promise<InteractionDoc | null> {
        const { data: interaction, error } = await supabase
            .from('interactions')
            .select()
            .eq('user_id', userId)
            .eq('poll_id', pollId)
            .single();
        if (error) return null;
        return interaction;
    }

    public static async getInteractionByUserIdAndQuizId(
        userId: string,
        quizId: number
    ): Promise<InteractionDoc | null> {
        const { data: interaction, error } = await supabase
            .from('interactions')
            .select()
            .eq('user_id', userId)
            .eq('quiz_id', quizId)
            .single();
        if (error) return null;
        return interaction;
    }

    public static async getInteractionByUserIdAndInputId(
        userId: string,
        inputId: number
    ): Promise<InteractionDoc | null> {
        const { data: interaction, error } = await supabase
            .from('interactions')
            .select()
            .eq('user_id', userId)
            .eq('input_id', inputId)
            .single();
        if (error) return null;
        return interaction;
    }

    public static async createInteraction(options: InteractionOptions): Promise<InteractionDoc> {
        const { data: interaction, error } = await supabase
            .from('interactions')
            .insert(options)
            .select()
            .single();
        if (error) throw error.message;
        return interaction;
    }

    public static async getVoteCountByDiscordId(discordId: string): Promise<number> {
        const { data, error } = await supabase.rpc('get_poll_vote_count', {
            discord_user_id: discordId,
        });
        if (error || data) return 0;
        return data;
    }
}
