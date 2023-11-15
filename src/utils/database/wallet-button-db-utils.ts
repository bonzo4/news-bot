import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type WalletButton = Database['public']['Tables']['wallet_buttons']['Row'];

export class WalletButtonDbUtils {
    public static async getWalletButtonsByEmbedId(embedId: number): Promise<WalletButton[]> {
        const { data: walletButtons, error } = await supabase
            .from('wallet_buttons')
            .select('*')
            .eq('embed_id', embedId);
        if (error) return [];
        return walletButtons;
    }

    public static async getWalletButtonById(id: number): Promise<WalletButton | null> {
        const { data, error } = await supabase
            .from('wallet_buttons')
            .select()
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return data;
    }
}
