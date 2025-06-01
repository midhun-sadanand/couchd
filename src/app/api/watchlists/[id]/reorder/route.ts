import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return new NextResponse('Items must be an array', { status: 400 });
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

    // Update the order of each item
    const updates = items.map((item, index) => ({
      id: item.id,
      order: index,
      updated_at: new Date().toISOString(),
    }));

    const { error: updateError } = await supabase
      .from('media_items')
      .upsert(updates, {
        onConflict: 'id',
      });

    if (updateError) throw updateError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error reordering watchlist items:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 