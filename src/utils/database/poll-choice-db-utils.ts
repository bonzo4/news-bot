import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type PollChoice = Database['public']['Tables']['poll_choices']['Row'];

export class PollChoicesDbUtils {
    public static async getChoicesByPollId(pollId: number): Promise<PollChoice[]> {
        const { data: choices, error } = await supabase
            .from('poll_choices')
            .select()
            .eq('poll_id', pollId);
        if (error) return null;
        return choices;
    }

    public static async getChoiceById(id: number): Promise<PollChoice | null> {
        const { data: choice, error } = await supabase
            .from('poll_choices')
            .select()
            .eq('id', id)
            .single();
        if (error) return null;
        return choice;
    }
}
