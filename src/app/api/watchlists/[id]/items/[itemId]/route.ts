import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await req.json();
    const { status, rating, notes, progress } = body;

    const { data: item, error } = await supabase
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

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse('Item not found', { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Error updating watchlist item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { data: item, error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', params.id)
      .eq('id', params.itemId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse('Item not found', { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Error deleting watchlist item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 