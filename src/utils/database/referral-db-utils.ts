import { supabase } from './index.js';
import { Logger } from '../../services/logger.js';
import { Database } from '../../types/supabase.js';

type GuildReferral = Database['public']['Tables']['guild_referrals']['Row'];

export class GuildReferralDbUtils {
    public static async getReferralByGuildId(guildId: string): Promise<GuildReferral | null> {
        const { data: guildReferral, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('guild_id', guildId)
            .single();
        if (error) return null;
        return guildReferral;
    }

    public static async createAmbassadorReferral(guildId: string, userId: string): Promise<void> {
        const { error } = await supabase.from('guild_referrals').upsert({
            guild_id: guildId,
            discord_user_id: userId,
            type: 'AMBASSADOR',
        });
        if (error)
            throw new Error(`Could not create guild referral in database:\n${error.message}`);
    }

    public static async createProfileReferral(guildId: string, userId: string): Promise<void> {
        const { error } = await supabase.from('guild_referrals').upsert({
            guild_id: guildId,
            discord_user_id: userId,
            type: 'PROFILE',
        });
        if (error)
            throw new Error(`Could not create guild referral in database:\n${error.message}`);
    }

    public static async getProfileReferralsByUserId(
        userId: string,
        page: number = 1, // default to page 1 if no page is provided
        itemsPerPage: number = 5 // you can adjust items per page as needed
    ): Promise<GuildReferral[]> {
        const start = (page - 1) * itemsPerPage;
        const end = page * itemsPerPage - 1;

        const { data, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('discord_user_id', userId)
            .order('updated_at', { ascending: false })
            .eq('type', 'PROFILE')
            .range(start, end);

        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return [];
        }
        return data;
    }

    public static async getProfileReferralCountByUserId(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('guild_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('discord_user_id', userId)
            .eq('type', 'PROFILE');

        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return 0;
        }
        return count;
    }

    public static async getAmbassadorReferralsByUserId(
        userId: string,
        page: number = 1, // default to page 1 if no page is provided
        itemsPerPage: number = 5 // you can adjust items per page as needed
    ): Promise<GuildReferral[]> {
        const start = (page - 1) * itemsPerPage;
        const end = page * itemsPerPage - 1;

        const { data, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('discord_user_id', userId)
            .order('updated_at', { ascending: false })
            .eq('type', 'AMBASSADOR')
            .range(start, end);

        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return [];
        }
        return data;
    }

    public static async getAmbassadorReferralCountByUserId(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('guild_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('discord_user_id', userId)
            .eq('type', 'AMBASSADOR');

        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return 0;
        }
        return count;
    }
}
