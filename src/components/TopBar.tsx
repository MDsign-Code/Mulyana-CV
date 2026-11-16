import React from 'react';
import { Bell, Download, Menu, X } from 'lucide-react';

export type AdminTab = 'analytics' | 'social' | 'reports' | 'cv';

interface TopBarProps {
  isAdminMode: boolean;
  isAuthorizedAdmin: boolean;
  activeAdminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
  onExitAdminMode: () => void;
  unreadAlertsCount: number;
  onToggleAlertsDrawer: () => void;
  onExportCvPdf: () => void;
}

const PUBLIC_NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '#profile', label: 'Profile' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#portfolio', label: 'Portfolio' },
];

const ADMIN_NAV_ITEMS: Array<{ id: AdminTab; label: string }> = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'social', label: 'Social Sync' },
  { id: 'reports', label: 'Reports & Email' },
  { id: 'cv', label: 'CV Preview' },
];

export const TopBar: React.FC<TopBarProps> = ({
  isAdminMode,
  isAuthorizedAdmin,
  activeAdminTab,
  onSelectAdminTab,
  onExitAdminMode,
  unreadAlertsCount,
  onToggleAlertsDrawer,
  onExportCvPdf,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const showAdminNav = isAdminMode && isAuthorizedAdmin;

  return (
    <header className="sticky top-0 z-40 border-b border-[#2B3449] bg-[#161B26]/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => {
            if (isAdminMode) {
              onExitAdminMode();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="font-display text-lg font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-amber-500 rounded"
        >
          Mulyana D-Zign
        </button>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {showAdminNav
            ? ADMIN_NAV_ITEMS.map((item) => {
                const isActive = activeAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectAdminTab(item.id)}
                    className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-500 ${
                      isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-amber-500" />
                    )}
                  </button>
                );
              })
            : PUBLIC_NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (isAdminMode) {
                      e.preventDefault();
                      onExitAdminMode();
                    }
                  }}
                  className="py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap shrink-0"
                >
                  {link.label}
                </a>
              ))}
        </nav>

        {/* Zone 3: Admin notification bell (Admin only) + Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {showAdminNav && (
            <button
              type="button"
              onClick={onToggleAlertsDrawer}
              aria-label={`Recruiter notifications (${unreadAlertsCount} unread)`}
              className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-[#2B3449] bg-[#1D2435] px-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-500 whitespace-nowrap shrink-0"
            >
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="font-mono-tabular text-xs font-semibold text-white">
                {unreadAlertsCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportCvPdf}
            className="hidden sm:inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-amber-500 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CV PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2B3449] text-slate-200 md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#2B3449] bg-[#1D2435] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {showAdminNav
              ? ADMIN_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectAdminTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                      activeAdminTab === item.id
                        ? 'bg-[#2B3449] text-white'
                        : 'text-slate-300 hover:bg-[#252E42]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              : PUBLIC_NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      if (isAdminMode) onExitAdminMode();
                      setMobileOpen(false);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-[#252E42]"
                  >
                    {link.label}
                  </a>
                ))}
            <button
              type="button"
              onClick={() => {
                onExportCvPdf();
                setMobileOpen(false);
              }}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 py-2.5 text-xs font-semibold text-slate-950"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CV PDF</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
