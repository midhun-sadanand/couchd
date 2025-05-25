#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# 0.  PRE-FLIGHT
###############################################################################
echo "🔧  Installing server packages …"
npm install --save @supabase/supabase-js @clerk/nextjs >/dev/null

###############################################################################
# 1.  DIRECTORY SKELETON
###############################################################################
echo "📂  Creating folders …"
declare -a DIRS=(
  "src/lib"
  "src/app/api/media-items/[id]/status"
  "src/app/api/media-items/[id]"
  "src/app/api/users"
  "src/app/api/users/[userId]"
  "src/app/api/get-users"
  "src/app/api/friend-request"
  "src/app/api/friend-request/accept"
  "src/app/api/friend-request/reject"
  "src/app/api/friend-requests"
  "src/app/api/friends/[userId]"
  "src/app/api/search"
  "src/app/api/watchlists"
  "src/app/api/watchlists/share"
)
for d in "${DIRS[@]}"; do mkdir -p "$d"; done

###############################################################################
# 2.  SHARED LIBS
###############################################################################
cat > src/lib/server.ts <<'EOF'
// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';
import { clerkClient }   from '@clerk/nextjs/server';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export { clerkClient };
EOF

cat > src/lib/updateCounters.ts <<'EOF'
// src/lib/updateCounters.ts
import { supabase } from './server';

export async function updateMediaItemCounters(watchlistId: number) {
  const { data: counts, error } = await supabase
    .from('media_items')
    .select('status, count:status')
    .eq('watchlist_id', watchlistId)
    .group('status');

  if (error) throw error;

  const toConsume   = counts.find(c => c.status === 'to consume')?.count ?? 0;
  const consuming   = counts.find(c => c.status === 'consuming')?.count ?? 0;
  const consumed    = counts.find(c => c.status === 'consumed')?.count  ?? 0;

  const { error: upErr } = await supabase
    .from('watchlists')
    .update({
      to_consume_count: toConsume,
      consuming_count : consuming,
      consumed_count  : consumed
    })
    .eq('id', watchlistId);

  if (upErr) throw upErr;
}
EOF

###############################################################################
# 3.  ROUTE HANDLERS (Next.js 13+/14  –  src/app/api/**/route.ts)
###############################################################################

# ---------- media-items status PUT ----------
cat > "src/app/api/media-items/[id]/status/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';
import { updateMediaItemCounters } from '@/lib/updateCounters';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();

  const { data, error } = await supabase
    .from('media_items')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateMediaItemCounters(data.watchlist_id);
  return NextResponse.json(data);
}
EOF

# ---------- media-items DELETE ----------
cat > "src/app/api/media-items/[id]/route.ts" <<'EOF'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';
import { updateMediaItemCounters } from '@/lib/updateCounters';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateMediaItemCounters(data.watchlist_id);
  return NextResponse.json(data);
}
EOF

# ---------- users GET all ----------
cat > "src/app/api/users/route.ts" <<'EOF'
import { NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET() {
  try {
    const users = await clerkClient.users.getUserList();
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOF

# ---------- users GET by id ----------
cat > "src/app/api/users/[userId]/route.ts" <<'EOF'
import { NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await clerkClient.users.getUser(params.userId);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOF

# ---------- get-users POST ----------
cat > "src/app/api/get-users/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();
    const users = await Promise.all(
      userIds.map((id: string) => clerkClient.users.getUser(id))
    );
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOF

# ---------- friend-request POST ----------
cat > "src/app/api/friend-request/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { senderId, senderUsername, receiverId, receiverUsername } =
    await req.json();

  const { data, error } = await supabase.from('friend_requests').insert([{
    sender_id   : senderId,
    sender_username : senderUsername,
    receiver_id : receiverId,
    receiver_username : receiverUsername,
    status      : 'pending'
  }]);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
EOF

# ---------- friend-request/accept POST ----------
cat > "src/app/api/friend-request/accept/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { requestId } = await req.json();

  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { sender_id, receiver_id } = data;

  const s = await supabase.rpc('append_friend', {
    p_profile_id: sender_id,
    p_friend_id : receiver_id
  });
  if (s.error)
    return NextResponse.json({ error: s.error.message }, { status: 500 });

  const r = await supabase.rpc('append_friend', {
    p_profile_id: receiver_id,
    p_friend_id : sender_id
  });
  if (r.error)
    return NextResponse.json({ error: r.error.message }, { status: 500 });

  await supabase.from('friend_requests').delete().eq('id', requestId);
  return NextResponse.json({ sender: s.data, receiver: r.data });
}
EOF

# ---------- friend-request/reject POST ----------
cat > "src/app/api/friend-request/reject/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { requestId } = await req.json();
  const { error } = await supabase.from('friend_requests')
                                  .delete()
                                  .eq('id', requestId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
EOF

# ---------- search GET ----------
cat > "src/app/api/search/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@/lib/server';

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get('query')?.toLowerCase() || '';

  try {
    const users = await clerkClient.users.getUserList();
    const filtered = users.filter(
      (u: any) => u.username && u.username.toLowerCase().includes(query)
    );
    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOF

# ---------- friends GET ----------
cat > "src/app/api/friends/[userId]/route.ts" <<'EOF'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const { data, error } = await supabase
    .from('friends')
    .select('friends')
    .eq('profile_id', params.userId)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
EOF

# ---------- friend-requests GET ----------
cat > "src/app/api/friend-requests/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(req: NextRequest) {
  const receiverId = new URL(req.url).searchParams.get('receiverId');

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', receiverId)
    .eq('status', 'pending');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
EOF

# ---------- watchlists POST ----------
cat > "src/app/api/watchlists/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { watchlistName, description, tags, isPublic, userId } = await req.json();

  const { data: wl, error: wlErr } = await supabase
    .from('watchlists')
    .insert([{
      name        : watchlistName,
      user_id     : userId,
      description ,
      tags        ,
      is_public   : isPublic
    }])
    .select();

  if (wlErr)
    return NextResponse.json({ error: wlErr.message }, { status: 500 });

  const newWatchlist = wl![0];

  const { error: ownErr } = await supabase
    .from('watchlist_ownership')
    .insert([{ user_id: userId, watchlist_id: newWatchlist.id }]);

  if (ownErr)
    return NextResponse.json({ error: ownErr.message }, { status: 500 });

  return NextResponse.json(newWatchlist, { status: 201 });
}
EOF

# ---------- watchlists/share POST ----------
cat > "src/app/api/watchlists/share/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { watchlistId, sharedWith } = await req.json();

  const { error: upErr } = await supabase
    .from('watchlists')
    .update({ shared_with: sharedWith })
    .eq('id', watchlistId);

  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  // add missing rows
  for (const uid of sharedWith) {
    const { data, error } = await supabase
      .from('watchlist_sharing')
      .select('*')
      .eq('shared_with_user_id', uid)
      .eq('watchlist_id', watchlistId)
      .single();

    if (error && error.code !== 'PGRST116')
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data) {
      const { error: insErr } = await supabase
        .from('watchlist_sharing')
        .insert([{ shared_with_user_id: uid, watchlist_id: watchlistId }]);
      if (insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  // remove stale rows
  const { data: rows, error: rowsErr } = await supabase
    .from('watchlist_sharing')
    .select('shared_with_user_id')
    .eq('watchlist_id', watchlistId);

  if (rowsErr)
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });

  for (const r of rows) {
    if (!sharedWith.includes(r.shared_with_user_id)) {
      const { error: delErr } = await supabase
        .from('watchlist_sharing')
        .delete()
        .eq('shared_with_user_id', r.shared_with_user_id)
        .eq('watchlist_id', watchlistId);
      if (delErr)
        return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Watchlist share settings updated' });
}
EOF

###############################################################################
# 4.  TYPE-SCRIPT PATH ALIAS  (optional quality-of-life)
###############################################################################
if ! grep -q '"@/' tsconfig.json >/dev/null 2>&1; then
  echo "🔧  Adding @ path alias to tsconfig.json"
  npx json -I -f tsconfig.json -e 'this.compilerOptions.paths={"@/*":["src/*"]}'
fi

###############################################################################
# 5.  DONE
###############################################################################
echo -e "\n✅  API scaffolding complete.  Run 'npm run dev' and test your endpoints."
