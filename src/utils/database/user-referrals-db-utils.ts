import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type UserReferral = Database['public']['Tables']['user_referrals']['Row'];

export class UserReferralDbUtils {
    public static async getReferralsByReferrerId(userId: string): Promise<UserReferral[]> {
        const { data, error } = await supabase
            .from('user_referrals')
            .select('*')
            .eq('referrer_id', userId);

        if (error) {
            return [];
        }

        return data;
    }

    public static async createReferral(userId: string, referralId: string): Promise<void> {
        const { error } = await supabase
            .from('user_referrals')
            .insert([{ user_id: userId, referrer_id: referralId }]);
        if (error) throw new Error(`Could not create referral:\n${error.message}`);
    }
}
