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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-md relative shadow-2xl border border-[#333333]">
        <button 
          className="absolute top-4 right-4 text-[#666666] hover:text-white transition-colors text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a2a]" 
          onClick={onClose}
        >
          ×
        </button>
        <style jsx global>{`
          .supabase-auth-ui_ui-container {
            font-family: 'EinaRegular', 'Inter', system-ui, sans-serif !important;
          }
          .supabase-auth-ui_ui-input {
            background-color: #2a2a2a !important;
            border: 1px solid #3a3a3a !important;
            border-radius: 10px !important;
            color: #ffffff !important;
            padding: 12px 16px !important;
            font-size: 15px !important;
            font-family: 'EinaRegular', 'Inter', system-ui, sans-serif !important;
            transition: all 0.2s ease !important;
          }
          .supabase-auth-ui_ui-input:focus {
            outline: none !important;
            border-color: #4a4a4a !important;
            background-color: #2f2f2f !important;
            box-shadow: none !important;
          }
          .supabase-auth-ui_ui-input::placeholder {
            color: #666666 !important;
          }
          .supabase-auth-ui_ui-label {
            color: #cccccc !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            margin-bottom: 8px !important;
            font-family: 'EinaRegular', 'Inter', system-ui, sans-serif !important;
          }
          .supabase-auth-ui_ui-button {
            background-color: #3a3a3a !important;
            border: none !important;
            border-radius: 10px !important;
            color: #ffffff !important;
            padding: 12px 20px !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            font-family: 'EinaSemibold', 'Inter', system-ui, sans-serif !important;
          }
          .supabase-auth-ui_ui-button:hover {
            background-color: #454545 !important;
            transform: translateY(-1px) !important;
          }
          .supabase-auth-ui_ui-button:active {
            transform: translateY(0px) !important;
          }
          .supabase-auth-ui_ui-anchor {
            color: #999999 !important;
            font-size: 14px !important;
            text-decoration: none !important;
            transition: color 0.2s ease !important;
            font-family: 'EinaRegular', 'Inter', system-ui, sans-serif !important;
          }
          .supabase-auth-ui_ui-anchor:hover {
            color: #ffffff !important;
            text-decoration: underline !important;
          }
          .supabase-auth-ui_ui-message {
            font-size: 13px !important;
            padding: 10px 14px !important;
            border-radius: 8px !important;
            font-family: 'EinaRegular', 'Inter', system-ui, sans-serif !important;
            background-color: #2a2a2a !important;
            border: 1px solid #3a3a3a !important;
            color: #d4a5a5 !important;
          }
          .supabase-auth-ui_ui-divider {
            background-color: #3a3a3a !important;
          }
        `}</style>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3a3a3a',
                  brandAccent: '#454545',
                  inputText: '#ffffff',
                  inputLabelText: '#cccccc',
                  inputBackground: '#2a2a2a',
                  inputBorder: '#3a3a3a',
                  inputBorderHover: '#4a4a4a',
                  inputBorderFocus: '#4a4a4a',
                  messageText: '#ffffff',
                  defaultButtonText: '#ffffff',
                  defaultButtonBackground: '#3a3a3a',
                  defaultButtonBackgroundHover: '#454545',
                  anchorTextColor: '#999999',
                  anchorTextHoverColor: '#ffffff',
                },
                space: {
                  inputPadding: '12px 16px',
                  buttonPadding: '12px 20px',
                },
                fontSizes: {
                  baseBodySize: '15px',
                  baseInputSize: '15px',
                  baseLabelSize: '14px',
                },
                radii: {
                  borderRadiusButton: '10px',
                  buttonBorderRadius: '10px',
                  inputBorderRadius: '10px',
                },
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