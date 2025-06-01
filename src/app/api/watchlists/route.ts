import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId, getToken } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const token = await getToken({ template: 'supabase' });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    const { data: watchlists, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(watchlists || []);
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = getAuth(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const token = await getToken({ template: 'supabase' });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    const body = await req.json();
    const { name, description, isPublic } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const { data: watchlist, error } = await supabase
      .from('watchlists')
      .insert([
        {
          name,
          description,
          is_public: isPublic || false,
          user_id: userId,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error creating watchlist:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
