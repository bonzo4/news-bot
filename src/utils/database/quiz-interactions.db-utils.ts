import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type QuizInteraction = Database['public']['Tables']['quiz_interactions']['Row'];

type QuizInteractionInsert = Database['public']['Tables']['quiz_interactions']['Insert'];

export class QuizInteractionsDbUtils {
    public static async getInteractionsByUserIdAndQuizId(
        userId: string,
        quizId: number
    ): Promise<QuizInteraction[] | null> {
        const { data, error } = await supabase
            .from('quiz_interactions')
            .select()
            .eq('user_id', userId)
            .eq('quiz_id', quizId);

        if (error || !data) {
            return [];
        }

        return data;
    }

    public static async createInteraction(
        interaction: QuizInteractionInsert
    ): Promise<QuizInteraction> {
        const { data, error } = await supabase
            .from('quiz_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
