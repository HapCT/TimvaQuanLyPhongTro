import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izhjfxuxlvifmeglgquc.supabase.co';

const supabaseAnonKey =
  'sb_publishable_qN2y2N0uO6Hbd-EwPIPKMA_PD0JTgR6';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);