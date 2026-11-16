import React from 'react';
import { BellRing, Check, CheckCheck, Volume2, VolumeX, X } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

interface RecruiterAlertDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigateToAnalytics: () => void;
}

export const RecruiterAlertDrawer: React.FC<RecruiterAlertDrawerProps> = ({
  open,
  onClose,
  onNavigateToAnalytics,
}) => {
  const {
    alerts,
    unreadAlertsCount,
    markAlertAsRead,
    markAllAlertsAsRead,
    soundEnabled,
    setSoundEnabled,
  } = usePortfolio();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[1px] no-print">
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-[#2B3449] bg-[#161B26] shadow-2xl"
        role="dialog"
        aria-label="Real-Time Recruiter Notifications"
      >
        <div className="flex items-center justify-between border-b border-[#2B3449] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Real-Time Recruiter Alerts
            </h2>
            <p className="text-xs text-slate-400 font-mono-tabular">
              {unreadAlertsCount} unread · {alerts.length} total recruiter events
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification panel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3449] text-slate-300 hover:bg-[#1D2435] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-[#2B3449] bg-[#1D2435] px-6 py-2.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-white"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>{soundEnabled ? 'Alert Chime On' : 'Alert Chime Off'}</span>
          </button>

          {unreadAlertsCount > 0 && (
            <button
              type="button"
              onClick={markAllAlertsAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#2B3449]">
          {alerts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BellRing className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-200">No recruiter visits yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Real-time alerts will appear here immediately when a recruiter or hiring manager views your profile.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const dateText = new Date(alert.createdAtIso).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={alert.id}
                  className={`px-6 py-4 transition-colors ${
                    alert.isRead ? 'bg-[#161B26]' : 'bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-amber-400">
                          {alert.isRead ? 'Read' : 'New'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.visitorRole}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{dateText}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {alert.visitorName}
                      </p>
                      <p className="text-xs text-slate-300">
                        {alert.company} · Via {alert.sourceChannel}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Section viewed: {alert.sectionViewed}
                      </p>
                    </div>

                    {!alert.isRead && (
                      <button
                        type="button"
                        onClick={() => markAlertAsRead(alert.id)}
                        title="Mark as read"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#2B3449] bg-[#1D2435] text-slate-300 hover:border-amber-400 hover:text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#2B3449] bg-[#1D2435] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToAnalytics();
            }}
            className="w-full rounded-lg bg-[#F58220] px-4 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Open Full Analytics Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
