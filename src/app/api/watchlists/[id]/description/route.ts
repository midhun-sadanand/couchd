import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { description } = await req.json();

    const { data: watchlist, error } = await supabase
      .from('watchlists')
      .update({ description })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse('Watchlist not found', { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(watchlist);
  } catch (err: any) {
    console.error('Error updating watchlist description:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 