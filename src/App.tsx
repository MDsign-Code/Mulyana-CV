import React, { useEffect, useState } from 'react';
import { BellRing, Lock, X } from 'lucide-react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { TopBar, type AdminTab } from './components/TopBar';
import { DigitalCvView } from './components/DigitalCvView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { SocialIntegrationView } from './components/SocialIntegrationView';
import { ReportsDigestView } from './components/ReportsDigestView';
import { RecruiterAlertDrawer } from './components/RecruiterAlertDrawer';
import { AdminLoginGate } from './components/AdminLoginGate';
import { exportDigitalCvToPdf } from './utils/exportUtils';
import {
  MULYANA_ABILITIES,
  MULYANA_EXPERIENCE,
  MULYANA_SKILLS,
} from './data/mulyanaCvData';

function detectAdminModeFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    window.location.pathname.endsWith('/admin') ||
    params.get('mode') === 'admin'
  );
}

const AppShell: React.FC<{
  isAdminMode: boolean;
  onEnterAdminMode: () => void;
  onExitAdminMode: () => void;
}> = ({ isAdminMode, onEnterAdminMode, onExitAdminMode }) => {
  const {
    profile,
    portfolioItems,
    isAuthorizedAdmin,
    unreadAlertsCount,
    latestToastAlert,
    dismissToastAlert,
    statusBanner,
    clearStatusBanner,
  } = usePortfolio();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('analytics');
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);

  const handleExportCvPdf = () => {
    exportDigitalCvToPdf(
      profile,
      MULYANA_EXPERIENCE,
      MULYANA_SKILLS,
      MULYANA_ABILITIES,
      portfolioItems
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#161B26] text-slate-100">
      <TopBar
        isAdminMode={isAdminMode}
        isAuthorizedAdmin={isAuthorizedAdmin}
        activeAdminTab={activeAdminTab}
        onSelectAdminTab={setActiveAdminTab}
        onExitAdminMode={onExitAdminMode}
        unreadAlertsCount={unreadAlertsCount}
        onToggleAlertsDrawer={() => setAlertsDrawerOpen(true)}
        onExportCvPdf={handleExportCvPdf}
      />

      {isAdminMode && isAuthorizedAdmin && statusBanner && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 no-print">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 sm:px-2">
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={clearStatusBanner}
              aria-label="Close message"
              className="text-amber-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {!isAdminMode ? (
          <DigitalCvView />
        ) : !isAuthorizedAdmin ? (
          <AdminLoginGate onBackToPublic={onExitAdminMode} />
        ) : (
          <>
            {activeAdminTab === 'analytics' && <AnalyticsDashboardView />}
            {activeAdminTab === 'social' && <SocialIntegrationView />}
            {activeAdminTab === 'reports' && <ReportsDigestView />}
            {activeAdminTab === 'cv' && <DigitalCvView />}
          </>
        )}
      </main>

      <footer className="border-t border-[#2B3449] bg-[#121722] py-8 no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {profile.brandName} · {profile.fullName} — Graphic Designer
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={profile.behanceUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Behance
            </a>
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Instagram
            </a>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            {isAdminMode ? (
              <button
                type="button"
                onClick={onExitAdminMode}
                className="font-medium text-slate-300 hover:text-white"
              >
                View Public Mode
              </button>
            ) : (
              <button
                type="button"
                onClick={onEnterAdminMode}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Lock className="h-3 w-3" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Real-time Recruiter Toast Notification ONLY in authenticated Admin Mode */}
      {isAdminMode && isAuthorizedAdmin && latestToastAlert && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 w-full max-w-sm rounded-xl border border-amber-500/40 bg-[#1D2435] p-4 shadow-2xl no-print"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <BellRing className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-400">
                Recruiter Viewed Your Profile
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white truncate">
                {latestToastAlert.visitorName} · {latestToastAlert.company}
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                {latestToastAlert.visitorRole} via {latestToastAlert.sourceChannel}
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    dismissToastAlert();
                    setActiveAdminTab('analytics');
                  }}
                  className="text-xs font-semibold text-amber-400 underline hover:text-amber-300"
                >
                  View Analytics
                </button>
                <button
                  type="button"
                  onClick={dismissToastAlert}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToastAlert}
              aria-label="Close notification"
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isAdminMode && isAuthorizedAdmin && (
        <RecruiterAlertDrawer
          open={alertsDrawerOpen}
          onClose={() => setAlertsDrawerOpen(false)}
          onNavigateToAnalytics={() => setActiveAdminTab('analytics')}
        />
      )}
    </div>
  );
};

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(detectAdminModeFromUrl);

  useEffect(() => {
    const onPopState = () => setIsAdminMode(detectAdminModeFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const enterAdminMode = () => {
    const basePath = import.meta.env.BASE_URL || '/';
    window.history.pushState({}, '', `${basePath}?mode=admin`);
    setIsAdminMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitAdminMode = () => {
    const basePath = import.meta.env.BASE_URL || '/';
    window.history.pushState({}, '', basePath);
    setIsAdminMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PortfolioProvider isAdminMode={isAdminMode}>
      <AppShell
        isAdminMode={isAdminMode}
        onEnterAdminMode={enterAdminMode}
        onExitAdminMode={exitAdminMode}
      />
    </PortfolioProvider>
  );
}
