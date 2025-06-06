import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(
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

    // Remove the share
    const { error: unshareError } = await supabase
      .from('watchlist_shares')
      .delete()
      .eq('watchlist_id', params.id);

    if (unshareError) throw unshareError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unsharing watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 