import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type ProfileButton = Database['public']['Tables']['profile_buttons']['Row'];

export class ProfileButtonDbUtils {
    public static async getProfileButtonById(id: number): Promise<ProfileButton | null> {
        const { data, error } = await supabase
            .from('profile_buttons')
            .select()
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return data;
    }
}
