import { createClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';
import type { Database } from './database.types';

export const supabaseBrowser = createClient<Database>(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
