import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type UserReferral = Database['public']['Tables']['user_referrals']['Row'];

export class UserReferralDbUtils {
    public static async getReferralsByReferrerId(
        userId: string,
        page: number = 1,
        itemsPerPage: number = 5
    ): Promise<UserReferral[]> {
        const start = (page - 1) * itemsPerPage;
        const end = page * itemsPerPage - 1;

        const { data, error } = await supabase
            .from('user_referrals')
            .select('*')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.log(error);
            return [];
        }

        return data;
    }

    public static async getReferralCountByReferrerId(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('user_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId);

        if (error) {
            return 0;
        }

        return count;
    }

    public static async createReferral(userId: string, referralId: string): Promise<void> {
        const { error } = await supabase
            .from('user_referrals')
            .insert([{ user_id: userId, referrer_id: referralId }]);
        if (error) throw new Error(`Could not create referral:\n${error.message}`);
    }
}
