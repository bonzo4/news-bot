import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Quiz = Database['public']['Tables']['quizzes']['Row'];

export class QuizDbUtils {
    public static async getQuizzesByEmbedId(embedId: number): Promise<Quiz[]> {
        const { data: quiz, error } = await supabase
            .from('quizzes')
            .select()
            .eq('embed_id', embedId);
        if (error) return [];
        return quiz;
    }

    public static async getQuizById(id: number): Promise<Quiz | null> {
        const { data: quiz, error } = await supabase.from('quizzes').select().eq('id', id).single();
        if (error) return null;
        return quiz;
    }
}
