import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase, useUser } from '../utils/auth';
import { useEffect } from 'react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  view?: 'sign_in' | 'sign_up';
}

export default function AuthModal({ open, onClose, view = 'sign_in' }: AuthModalProps) {
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
      <div className="bg-[#232323] rounded-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-white" onClick={onClose}>✕</button>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#404040',
                  brandAccent: '#525252',
                  inputText: '#fff',
                  inputLabelText: '#fff',
                  messageText: '#fff',
                  defaultButtonText: '#fff',
                },
                fonts: {
                  bodyFontFamily: 'Inter, system-ui, sans-serif',
                  buttonFontFamily: 'Inter, system-ui, sans-serif',
                  inputFontFamily: 'Inter, system-ui, sans-serif',
                  labelFontFamily: 'Inter, system-ui, sans-serif',
                },
                fontSizes: {
                  baseButtonSize: '14px',
                  baseInputSize: '14px',
                  baseLabelSize: '14px',
                },
                radii: {
                  borderRadiusButton: '8px',
                  buttonBorderRadius: '8px',
                  inputBorderRadius: '8px',
                },
              },
            },
            style: {
              button: {
                borderRadius: '8px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                color: '#fff',
              },
              input: {
                borderRadius: '8px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                color: '#fff',
              },
              label: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                color: '#fff',
              },
              message: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                color: '#fff',
              },
              anchor: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                color: '#fff',
              },
            },
          }}
          providers={[]}
          view={view}
        />
      </div>
    </div>
  );
} 