import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type WalletInteraction = Database['public']['Tables']['wallet_interactions']['Row'];

type WalletInteractionInsert = Database['public']['Tables']['wallet_interactions']['Insert'];

export class WalletInteractionDbUtils {
    public static async createInteraction(
        interaction: WalletInteractionInsert
    ): Promise<WalletInteraction> {
        const { data, error } = await supabase
            .from('wallet_interactions')
            .insert(interaction)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
