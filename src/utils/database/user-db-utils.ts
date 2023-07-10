import { User } from 'discord.js';

import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type UserDoc = Database['public']['Tables']['discord_users']['Row'];

export class UserDbUtils {
    public static async createUser(user: User): Promise<UserDoc> {
        const { data: userDoc, error } = await supabase
            .from('discord_users')
            .upsert({
                id: user.id,
                name: user.username,
                image: user.displayAvatarURL(),
            })
            .select()
            .single();
        if (error) throw new Error(`Could not create user in database:\n${error.message}`);
        return userDoc;
    }

    public static async getUser(user: User): Promise<UserDoc | null> {
        const { data: userDoc, error } = await supabase
            .from('discord_users')
            .select('*')
            .eq('id', user.id)
            .single();
        if (error) return null;
        return userDoc;
    }

    public static async getUserById(id: string): Promise<UserDoc | null> {
        const { data: userDoc, error } = await supabase
            .from('discord_users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return userDoc;
    }

    public static async getUserByReferralCode(code: string): Promise<UserDoc | null> {
        const { data: userDoc, error } = await supabase
            .from('discord_users')
            .select('*')
            .eq('referral_code', code)
            .single();
        if (error) return null;
        return userDoc;
    }

    public static async updateUser(id: string, data: Partial<UserDoc>): Promise<void> {
        const { error } = await supabase.from('discord_users').update(data).eq('id', id).single();
        if (error) throw new Error(`Could not update user in database:\n${error.message}`);
    }
}
