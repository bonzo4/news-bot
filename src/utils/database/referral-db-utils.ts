import { supabase } from './index.js';
import { Logger } from '../../services/logger.js';
import { Database } from '../../types/supabase.js';

type GuildReferral = Database['public']['Tables']['guild_referrals']['Row'];

export class ReferralDbUtils {
    public static async getGuildReferralByGuild(guildId: string): Promise<GuildReferral | null> {
        const { data: guildReferral, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('guild_id', guildId)
            .single();
        if (error) return null;
        return guildReferral;
    }

    public static async createGuildReferral(guildId: string, userId: string): Promise<void> {
        const { error } = await supabase.from('guild_referrals').upsert({
            guild_id: guildId,
            discord_user_id: userId,
        });
        if (error)
            throw new Error(`Could not create guild referral in database:\n${error.message}`);
    }

    public static async getReferralsByUserId(userId: string): Promise<GuildReferral[]> {
        const { data: guildReferrals, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('discord_user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return [];
        }
        return guildReferrals;
    }
}
