import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase, useUser } from '../utils/auth';
import { useEffect } from 'react';

export default function AuthModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { client: supabase } = useSupabase();
  const { user } = useUser();

  useEffect(() => {
    if (user && open) {
      onClose();
    }
  }, [user, open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
        />
      </div>
    </div>
  );
} 