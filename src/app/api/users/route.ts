import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET() {
  try {
    // Fetch all users from Supabase profiles table
    const { data: users, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
