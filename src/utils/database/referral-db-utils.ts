import { Guild } from 'discord.js';

import { supabase } from './index.js';
import { UserDoc } from './user-db-utils.js';
import { Logger } from '../../services/logger.js';
import { Database } from '../../types/supabase.js';

export type GuildReferral = Database['public']['Tables']['guild_referrals']['Row'];

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

    public static async createGuildReferral(guild: Guild, user: UserDoc): Promise<void> {
        const { error } = await supabase.from('guild_referrals').upsert({
            guild_id: guild.id,
            user_id: user.id,
        });
        if (error)
            throw new Error(`Could not create guild referral in database:\n${error.message}`);
    }

    public static async getReferralsByUser(userId: string): Promise<GuildReferral[]> {
        const { data: guildReferrals, error } = await supabase
            .from('guild_referrals')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            await Logger.error({
                message: `Could not get guild referrals from database + ${error.message}`,
            });
            return [];
        }
        return guildReferrals;
    }
}
