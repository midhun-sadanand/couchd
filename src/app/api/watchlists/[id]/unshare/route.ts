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
    const { sharedUserId } = body;

    if (!sharedUserId) {
      return new NextResponse('Missing sharedUserId', { status: 400 });
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

    // Remove the share
    const { error: unshareError } = await supabase
      .from('watchlist_shares')
      .delete()
      .eq('watchlist_id', params.id)
      .eq('shared_user_id', sharedUserId);

    if (unshareError) throw unshareError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unsharing watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 