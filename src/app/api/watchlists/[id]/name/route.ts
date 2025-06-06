import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user owns the watchlist
    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (watchlistError) {
      if (watchlistError.code === 'PGRST116') {
        return new NextResponse('Watchlist not found', { status: 404 });
      }
      throw watchlistError;
    }

    // Update the watchlist name
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const { data: updatedWatchlist, error: updateError } = await supabase
      .from('watchlists')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedWatchlist);
  } catch (error) {
    console.error('Error updating watchlist name:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 