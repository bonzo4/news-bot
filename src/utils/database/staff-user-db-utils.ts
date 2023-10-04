import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type StaffUser = Database['public']['Tables']['staff_users']['Row'];

export class StaffUserDbUtils {
    public static async getStaffRoleByUserId(userId: string): Promise<StaffUser | null> {
        const { data, error } = await supabase
            .from('staff_users')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) return null;
        return data;
    }
}
