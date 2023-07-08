import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';

import { config } from '../../config/config.js';
import { Database } from '../../types/supabase.js';

const require = createRequire(import.meta.url);
require('dotenv').config();

export const supabase = createClient<Database>(config.supabaseUrl, process.env.SUPABASE_KEY, {
    auth: {
        persistSession: false,
    },
});
