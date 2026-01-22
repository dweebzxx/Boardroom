import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import type { Database } from './database.types';

const serverEnv = getServerEnv();

export const supabaseServer = createClient<Database>(
  serverEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
