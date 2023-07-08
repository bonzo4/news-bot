import { supabase } from './index.js';
import { Database } from '../../types/supabase.js';

export type Redirect = Database['public']['Tables']['redirects']['Row'];

export type RedirectOptions = Database['public']['Tables']['redirects']['Insert'];

export class RedirectDbUtils {
    public static async createRedirect(options: RedirectOptions): Promise<Redirect> {
        const { data: redirect, error } = await supabase
            .from('redirects')
            .insert(options)
            .select()
            .single();
        if (error) throw error.message;
        return redirect;
    }
}
