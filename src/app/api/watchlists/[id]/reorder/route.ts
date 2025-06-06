import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return new NextResponse('Items must be an array', { status: 400 });
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