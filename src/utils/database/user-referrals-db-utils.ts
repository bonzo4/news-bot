import { supabase } from '.';

export class UserReferralDbUtils {
    public static async createReferral(userId: string, referralId: string): Promise<void> {
        const { error } = await supabase
            .from('user_referrals')
            .insert([{ user_id: userId, referrer_id: referralId }]);
        if (error) throw new Error(`Could not create referral:\n${error.message}`);
    }
}
