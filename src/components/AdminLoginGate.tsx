import React from 'react';
import { ArrowLeft, Lock, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { ADMIN_OWNER_EMAIL, usePortfolio } from '../context/PortfolioContext';

interface AdminLoginGateProps {
  onBackToPublic: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onBackToPublic }) => {
  const { user, authReady, isSigningIn, signInWithGoogle, signOutUser, isAuthorizedAdmin } =
    usePortfolio();

  if (!authReady) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-[#2B3449] bg-[#1D2435] p-8 text-center">
          <p className="text-sm font-medium text-slate-300">Checking authentication session...</p>
        </div>
      </div>
    );
  }

  if (user && !isAuthorizedAdmin) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-[#2B3449] bg-[#1D2435] p-8 space-y-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-white">
              Admin Portal Access Restricted
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              You are currently signed in as{' '}
              <span className="font-semibold text-white">{user.email}</span>. The visitor analytics dashboard, real-time recruiter alerts, and email reports are strictly restricted to the verified owner account (
              <span className="font-mono-tabular text-xs font-semibold text-amber-400">
                {ADMIN_OWNER_EMAIL}
              </span>
              ).
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Switch Google Account</span>
            </button>
            <button
              type="button"
              onClick={onBackToPublic}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-semibold text-slate-200 hover:border-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Public CV</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-[#2B3449] bg-[#1D2435] p-8 space-y-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <Lock className="h-5 w-5" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-400">Mulyana D-Zign · Owner Portal</p>
          <h1 className="font-display text-2xl font-bold text-white">
            Sign In to Access Analytics & Reports
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            The public Digital CV is open to clients and recruiters without sign-in. To inspect profile visitors, real-time recruiter alerts, social sync settings, and PDF/CSV exports, sign in with the verified owner Google account.
          </p>
        </div>

        <div className="rounded-xl border border-[#2B3449] bg-[#161B26] p-4 text-xs text-slate-300">
          Authorized admin account:{' '}
          <span className="font-mono-tabular font-semibold text-amber-400">
            {ADMIN_OWNER_EMAIL}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#F58220] px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google (Admin)'}</span>
          </button>

          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-medium text-slate-200 hover:border-slate-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Public Digital CV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
