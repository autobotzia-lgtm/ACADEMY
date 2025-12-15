import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enggkdqzgxevhcncymuw.supabase.co';
const supabaseAnonKey = 'sb_publishable_MBEsD4616vi8LJ1S4gCDSA_pZwKfCvo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);