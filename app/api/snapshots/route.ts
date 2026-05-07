import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 100);

  const db = supabaseServer();
  const { data, error } = await db
    .from('sentiment_snapshots')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
