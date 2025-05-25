#!/bin/bash

# Initialize a new Node.js project and install dependencies
npm init -y
npm install next react react-dom @clerk/nextjs @supabase/supabase-js @tanstack/react-query @geist-ui/core @geist-ui/icons framer-motion react-beautiful-dnd animejs classnames lodash
npm install -D typescript tailwindcss postcss autoprefixer @types/react @types/node @types/lodash @types/react-beautiful-dnd @types/animejs @types/classnames

# Add Next.js build scripts to package.json
npm set-script dev "next dev"
npm set-script build "next build"
npm set-script start "next start"

# Initialize Tailwind CSS and PostCSS configuration
npx tailwindcss init -p

# Create required directories
mkdir -p src/app/api/friend-requests
mkdir -p src/app/api/friends
mkdir -p src/app/api/get-users
mkdir -p src/app/api/media-items
mkdir -p src/app/api/search
mkdir -p src/app/api/users
mkdir -p src/app/api/watchlists
mkdir -p "src/app/sign-in/[[...index]]"
mkdir -p "src/app/sign-up/[[...index]]"
mkdir -p src/components
mkdir -p src/lib
mkdir -p src/styles
mkdir -p src/types
mkdir -p public/fonts
mkdir -p public/images

# (Manual step) Copy the legacy font files (e.g., .woff2, .woff, .ttf) into the ./public/fonts/ directory
# (Manual step) Copy any required image assets (e.g., logos, icons, favicon.ico) from the legacy app into the ./public/ directory

# Write Tailwind CSS configuration (overriding the default content paths and adding custom font families)
cat > tailwind.config.js <<'EOF'
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace']
      }
    }
  },
  plugins: []
}
EOF

# Write global CSS file
cat > src/app/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles (if any) can be added here */
EOF

# Write Next.js layout component
cat > src/app/layout.tsx <<'EOF'
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import '../app/globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Couchd',
  description: 'Next.js 14 Couchd app migration'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}>
          <header className="w-full border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <h1 className="text-lg font-bold">Couchd</h1>
            <nav>
              <SignedOut>
                <Link href="/sign-in" className="mr-4">Sign In</Link>
                <Link href="/sign-up">Sign Up</Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </nav>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
EOF

# Write Next.js homepage component
cat > src/app/page.tsx <<'EOF'
"use client";
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import classNames from 'classnames';

import AddItemModal from '@/components/AddItemModal';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface WatchlistItem {
  id: string;
  user_id: string;
  title: string;
  poster_url: string;
  type: string;
  total_episodes: number | null;
  watched_episodes: number;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at?: string;
  user?: UserProfile;
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'friends'>('watchlist');
  const [showAddModal, setShowAddModal] = useState(false);

  // Ensure user profile exists in database
  useEffect(() => {
    if (user) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress, name: user.firstName || null })
      }).catch(console.error);
    }
  }, [user]);

  // Fetch watchlist items
  const watchlistQuery = useQuery(['watchlist'], async () => {
    const res = await fetch('/api/watchlists');
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    return res.json() as Promise<WatchlistItem[]>;
  });

  // Fetch friends and friend requests
  const friendListQuery = useQuery(['friends'], async () => {
    const res = await fetch('/api/friends');
    if (!res.ok) throw new Error('Failed to fetch friends');
    return res.json() as Promise<UserProfile[]>;
  });
  const friendRequestsQuery = useQuery(['friendRequests'], async () => {
    const res = await fetch('/api/friend-requests');
    if (!res.ok) throw new Error('Failed to fetch friend requests');
    return res.json() as Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>;
  });

  // Mutations for friend actions
  const acceptFriendMutation = useMutation(async (friendId: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId })
    });
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      queryClient.invalidateQueries(['friendRequests']);
    }
  });

  const declineFriendMutation = useMutation(async (requestId: string) => {
    await fetch('/api/friend-requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
    }
  });

  const removeFriendMutation = useMutation(async (friendId: string) => {
    await fetch('/api/friends', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId })
    });
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
    }
  });

  if (!user) {
    // If not signed in, perhaps show nothing or prompt (Clerk will redirect via middleware)
    return <main className="p-4">Please sign in to use the app.</main>;
  }

  const watchlistItems = watchlistQuery.data || [];
  const friends = friendListQuery.data || [];
  const incomingRequests = friendRequestsQuery.data?.incoming || [];
  const outgoingRequests = friendRequestsQuery.data?.outgoing || [];

  return (
    <main className="p-4">
      <div className="mb-4">
        <button
          className={classNames("px-4 py-2 mr-2 rounded", { 'bg-gray-200': activeTab === 'watchlist', 'bg-white': activeTab !== 'watchlist' })}
          onClick={() => setActiveTab('watchlist')}
        >
          Watchlist
        </button>
        <button
          className={classNames("px-4 py-2 rounded", { 'bg-gray-200': activeTab === 'friends', 'bg-white': activeTab !== 'friends' })}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
      </div>

      {activeTab === 'watchlist' && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Watchlist</h2>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">+ Add Item</button>
          </div>
          {watchlistQuery.isLoading ? (
            <p>Loading watchlist...</p>
          ) : watchlistQuery.isError ? (
            <p className="text-red-500">Failed to load watchlist.</p>
          ) : (
            <ul>
              {watchlistItems.map(item => (
                <li key={item.id} className="mb-3 p-3 border rounded flex items-center justify-between">
                  <div className="flex items-center">
                    {item.poster_url && (
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.poster_url} alt={item.title} className="w-12 h-18 object-cover rounded mr-3" />
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.total_episodes && item.total_episodes > 1 ? (
                        <p className="text-sm text-gray-600">Episodes: {item.watched_episodes} / {item.total_episodes}</p>
                      ) : (
                        <p className="text-sm text-gray-600">{item.watched_episodes === item.total_episodes ? 'Watched' : 'Not watched'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {item.total_episodes && item.total_episodes > 1 ? (
                      <button
                        onClick={async () => {
                          // Increment watched episodes
                          const newCount = Math.min((item.watched_episodes || 0) + 1, item.total_episodes || 0);
                          await fetch('/api/media-items', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: item.id, watchedEpisodes: newCount })
                          });
                          queryClient.invalidateQueries(['watchlist']);
                        }}
                        className="mr-2 px-3 py-1 bg-green-600 text-white text-sm rounded"
                        disabled={item.total_episodes && item.watched_episodes >= item.total_episodes}
                      >
                        +1
                      </button>
                    ) : null}
                    <button
                      onClick={async () => {
                        await fetch('/api/media-items', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: item.id })
                        });
                        queryClient.invalidateQueries(['watchlist']);
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {showAddModal && (
            <AddItemModal onClose={() => setShowAddModal(false)} />
          )}
        </section>
      )}

      {activeTab === 'friends' && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Friends &amp; Requests</h2>
          <div className="mb-4">
            <h3 className="font-medium">Add Friend</h3>
            <FriendSearch friends={friends} incomingRequests={incomingRequests} outgoingRequests={outgoingRequests} />
          </div>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Friend Requests</h3>
            {incomingRequests.length === 0 ? (
              <p className="text-gray-600 text-sm">No incoming friend requests.</p>
            ) : (
              <ul>
                {incomingRequests.map(req => (
                  <li key={req.id} className="mb-2 flex justify-between items-center">
                    <span>
                      {req.user?.name || req.user?.email}{" "}
                      <span className="text-gray-500 text-sm">(wants to be friends)</span>
                    </span>
                    <span>
                      <button onClick={() => acceptFriendMutation.mutate(req.user?.id || '')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded mr-2">Accept</button>
                      <button onClick={() => declineFriendMutation.mutate(req.id)} className="px-3 py-1 bg-gray-300 text-sm rounded">Decline</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">My Friends</h3>
            {friends.length === 0 ? (
              <p className="text-gray-600 text-sm">You have no friends added yet.</p>
            ) : (
              <ul>
                {friends.map(fr => (
                  <li key={fr.id} className="mb-2 flex justify-between items-center">
                    <span>{fr.name || fr.email}</span>
                    <button onClick={() => removeFriendMutation.mutate(fr.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function FriendSearch({ friends, incomingRequests, outgoingRequests }: {
  friends: UserProfile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searchError, setSearchError] = useState('');

  const searchMutation = useMutation(async (term: string) => {
    const res = await fetch('/api/get-users?query=' + encodeURIComponent(term));
    if (!res.ok) throw new Error('Search failed');
    return res.json() as Promise<UserProfile[]>;
  }, {
    onSuccess: (data) => {
      setResults(data);
      setSearchError('');
    },
    onError: () => {
      setResults([]);
      setSearchError('No users found.');
    }
  });

  const sendRequestMutation = useMutation(async (userId: string) => {
    await fetch('/api/friend-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  }, {
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries(['friendRequests']);
      alert('Friend request sent');
    },
    onError: () => {
      alert('Failed to send friend request');
    }
  });

  const handleSearch = () => {
    if (query.trim().length === 0) return;
    searchMutation.mutate(query.trim());
  };

  const alreadyFriend = (userId: string) => friends.some(f => f.id === userId);
  const requestOutgoing = (userId: string) => outgoingRequests.some(r => r.receiver_id === userId);
  const requestIncoming = (userId: string) => incomingRequests.some(r => r.sender_id === userId);

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search by name or email"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border px-2 py-1 mr-2"
      />
      <button onClick={handleSearch} className="px-3 py-1 bg-blue-500 text-white text-sm rounded">Search</button>
      {searchMutation.isLoading && <p className="text-sm text-gray-600">Searching...</p>}
      {searchError && <p className="text-sm text-red-500">{searchError}</p>}
      {results.length > 0 && (
        <ul className="mt-2">
          {results.map(u => (
            <li key={u.id} className="mb-1 flex justify-between items-center">
              <span>{u.name || u.email}</span>
              <span>
                {alreadyFriend(u.id) ? (
                  <span className="text-green-600 text-sm">Already friends</span>
                ) : requestIncoming(u.id) ? (
                  <span className="text-blue-600 text-sm">They sent you a request</span>
                ) : requestOutgoing(u.id) ? (
                  <span className="text-gray-600 text-sm">Request sent</span>
                ) : (
                  <button onClick={() => sendRequestMutation.mutate(u.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Add</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

# Write custom sign-in and sign-up pages
cat > src/app/sign-in/[[...index]]/page.tsx <<'EOF'
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn routing="path" path="/sign-in" />;
}
EOF

cat > src/app/sign-up/[[...index]]/page.tsx <<'EOF'
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return <SignUp routing="path" path="/sign-up" />;
}
EOF

# Write Clerk middleware for authentication
cat > src/middleware.ts <<'EOF'
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip static files and Next internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Apply to all API routes
    '/(api)(.*)'
  ]
};
EOF

# Write Supabase client library
cat > src/lib/supabase.ts <<'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default supabase;
EOF

# Write environment variables file
cat > .env.local <<'EOF'
# Clerk API Keys (replace with your actual keys)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase keys (replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# External API keys
TMDB_API_KEY=  # e.g., your TheMovieDB API key
EOF

# Write Next.js configuration file
cat > next.config.ts <<'EOF'
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  images: {
    domains: ['image.tmdb.org']
  }
};
export default nextConfig;
EOF

# Write next-env.d.ts (Next.js TypeScript definitions)
cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />
EOF

# Write TypeScript configuration
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
EOF

# Write basic ESLint configuration
cat > eslint.config.mjs <<'EOF'
import nextPlugin from '@next/eslint-plugin-next';
export default [
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals']
];
EOF

echo "All done! Now fill in the .env.local file, copy your font and image assets into the public folder, and run 'npm run dev' to start the development server."

