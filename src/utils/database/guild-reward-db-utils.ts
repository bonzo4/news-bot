import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

type GuildReferralReward = Database['public']['Tables']['guild_referral_rewards']['Row'];

export default class GuildRewardDbUtils {
    public static async getNextReward(referralCount: number): Promise<GuildReferralReward> {
        const { data, error } = await supabase
            .from('guild_referral_rewards')
            .select()
            .gte('guild_requirement', referralCount + 1)
            .order('guild_requirement', { ascending: true })
            .limit(1)
            .single();

        if (error || !data) return null;

        return data;
    }
}
