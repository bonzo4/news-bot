import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type QuizChoice = Database['public']['Tables']['quiz_choices']['Row'];

export class QuizChoicesDbUtils {
    public static async getChoicesByQuizId(quizId: number): Promise<QuizChoice[]> {
        const { data: choices, error } = await supabase
            .from('quiz_choices')
            .select()
            .eq('quiz_id', quizId);
        if (error) return null;
        return choices;
    }

    public static async getChoiceById(id: number): Promise<QuizChoice | null> {
        const { data: choice, error } = await supabase
            .from('quiz_choices')
            .select()
            .eq('id', id)
            .single();
        if (error) return null;
        return choice;
    }
}
