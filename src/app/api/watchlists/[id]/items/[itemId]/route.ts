import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { status, rating, notes, progress } = body;

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

    if (watchlist.user_id !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Update the item
    const { data: item, error: itemError } = await supabase
      .from('media_items')
      .update({
        status,
        rating,
        notes,
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.itemId)
      .eq('watchlist_id', params.id)
      .select()
      .single();

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return new NextResponse('Item not found', { status: 404 });
      }
      throw itemError;
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    if (watchlist.user_id !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('media_items')
      .delete()
      .eq('id', params.itemId)
      .eq('watchlist_id', params.id);

    if (deleteError) throw deleteError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting watchlist item:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 