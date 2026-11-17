import { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: (mode: 'signin' | 'signup', email: string | null) => void;
}

export function GoogleAuthModal({
  isOpen,
  initialTab = 'signin',
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialTab);
      setErrorMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      onSuccess(mode, cred.user.email);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google authentication was cancelled or failed.';
      if (message.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in popup was closed before completing authentication.');
      } else if (message.includes('popup-blocked')) {
        setErrorMsg('Browser blocked the Google popup. Please allow popups for this site and retry.');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="google-auth-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {mode === 'signin'
                ? 'Sign In to RankFlow AI'
                : 'Create Your RankFlow AI Workspace'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Shri Shyam Consulting · Cloud Sync & Multi-Device Access
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Google Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Google Sign Up
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {mode === 'signin'
                ? 'Restore your saved VIP CRM leads, tracked keywords, and Make.com webhook settings.'
                : 'Provision a dedicated cloud workspace pre-loaded with Shri Shyam Consulting SEO & CRM templates.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              Protected by verified Google OAuth & user-isolated Firestore security rules.
            </span>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleAuth}
          className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-60 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>
                {mode === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
