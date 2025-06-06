import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return new NextResponse('isPublic must be a boolean', { status: 400 });
    }

    // Update the watchlist visibility
    const { data: updatedWatchlist, error: updateError } = await supabase
      .from('watchlists')
      .update({
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedWatchlist);
  } catch (error) {
    console.error('Error updating watchlist visibility:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 