import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: items, error } = await supabase
      .from('media_items')
      .select('*')
      .eq('watchlist_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error fetching watchlist items:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, type, imageUrl } = await req.json();

    const { data: item, error } = await supabase
      .from('watchlist_items')
      .insert([
        {
          watchlist_id: params.id,
          title,
          type,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Error creating watchlist item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 