import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SentimentSnapshot } from './types';

function getClient(key?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k   = key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !k) throw new Error('Supabase env vars not configured');
  return createClient(url, k);
}

export function supabaseServer(): SupabaseClient {
  return getClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getLatestSnapshot(): Promise<SentimentSnapshot | null> {
  try {
    const { data, error } = await getClient()
      .from('sentiment_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as SentimentSnapshot;
  } catch {
    return null;
  }
}

export async function getSnapshotHistory(limit = 30): Promise<SentimentSnapshot[]> {
  try {
    const { data, error } = await getClient()
      .from('sentiment_snapshots')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as SentimentSnapshot[];
  } catch {
    return [];
  }
}
