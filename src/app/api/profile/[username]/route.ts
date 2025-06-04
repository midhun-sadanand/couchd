import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { getToken } = getAuth(req);
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', params.username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse('Profile not found', { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 