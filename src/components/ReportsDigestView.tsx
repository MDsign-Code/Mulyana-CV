import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Send,
} from 'lucide-react';
import {
  MULYANA_ABILITIES,
  MULYANA_CONTACT,
  MULYANA_EXPERIENCE,
  MULYANA_SKILLS,
} from '../data/mulyanaCvData';
import { usePortfolio } from '../context/PortfolioContext';
import type { DigestDay } from '../types';
import {
  exportAnalyticsToPdf,
  exportDigitalCvToPdf,
  exportVisitsToCsv,
} from '../utils/exportUtils';

const DAYS: Array<{ value: DigestDay; label: string }> = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

export const ReportsDigestView: React.FC = () => {
  const {
    profile,
    portfolioItems,
    visits,
    digestSettings,
    updateDigestSettings,
  } = usePortfolio();

  const [emailInput, setEmailInput] = useState(digestSettings.recipientEmail);
  const [isSending, setIsSending] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{
    message: string;
    htmlBody?: string;
    subject?: string;
  } | null>(null);

  const weeklySummary = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const recent = visits.filter((v) => v.visitDate >= cutoffStr);
    const totalVisits = recent.length;
    const recruiterVisits = recent.filter((v) => v.isRecruiter).length;
    const avgDurationSec =
      totalVisits > 0
        ? Math.round(recent.reduce((acc, v) => acc + v.durationSeconds, 0) / totalVisits)
        : 0;

    const counts: Record<string, number> = {};
    for (const v of recent) {
      counts[v.sourceChannel] = (counts[v.sourceChannel] || 0) + 1;
    }
    const topChannel =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'LinkedIn';
    const topProject = portfolioItems[0]?.title || 'Algoplay Seaweed Face Mask Packaging';

    return {
      totalVisits,
      recruiterVisits,
      avgDurationSec,
      topChannel,
      topProject,
      recentRecruiters: recent.filter((v) => v.isRecruiter).slice(0, 5),
    };
  }, [visits, portfolioItems]);

  const handleSaveDigestPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDigestSettings({ recipientEmail: emailInput.trim() });
    setDispatchStatus({
      message: `Weekly digest preferences for ${emailInput.trim()} have been saved.`,
    });
  };

  const handleSendTestDigest = async () => {
    setIsSending(true);
    const targetEmail = emailInput.trim() || digestSettings.recipientEmail;
    try {
      const resp = await fetch('/api/digest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: targetEmail,
          fullName: profile.fullName,
          totalVisits: weeklySummary.totalVisits,
          recruiterVisits: weeklySummary.recruiterVisits,
          topChannel: weeklySummary.topChannel,
          topProject: weeklySummary.topProject,
          recentRecruiters: weeklySummary.recentRecruiters,
        }),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok || !contentType.includes('application/json')) {
        throw new Error('STATIC_FALLBACK');
      }
      const data = await resp.json();

      await updateDigestSettings({
        recipientEmail: targetEmail,
        lastSentAt: data.sentAt,
        totalSent: (digestSettings.totalSent || 0) + 1,
      });

      setDispatchStatus({
        message: data.deliveryMessage,
        htmlBody: data.htmlBody,
        subject: data.subject,
      });
    } catch {
      const subject = `Weekly Portfolio Summary — ${profile.fullName} (${weeklySummary.recruiterVisits} Recruiter Visits)`;
      const recruiterRows = weeklySummary.recentRecruiters
        .map(
          (r) =>
            `<li><strong>${r.visitorName}</strong> (${r.visitorRole} — ${r.company}) via ${r.sourceChannel}</li>`
        )
        .join('');
      const htmlBody = `<!doctype html><html><body style="font-family:sans-serif;padding:24px;"><h2>${subject}</h2><p>Total visits (7 days): <strong>${weeklySummary.totalVisits}</strong> | Recruiters: <strong>${weeklySummary.recruiterVisits}</strong> | Top channel: <strong>${weeklySummary.topChannel}</strong></p><ul>${recruiterRows || '<li>No recruiter visits recorded this week.</li>'}</ul><p>Featured work: ${weeklySummary.topProject}</p></body></html>`;
      await updateDigestSettings({
        recipientEmail: targetEmail,
        lastSentAt: new Date().toISOString(),
        totalSent: (digestSettings.totalSent || 0) + 1,
      });
      setDispatchStatus({
        message: `Weekly digest for ${targetEmail} prepared. Download the .eml copy below to review or forward it.`,
        htmlBody,
        subject,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadEml = () => {
    if (!dispatchStatus?.htmlBody) return;
    const eml = [
      `To: ${emailInput || digestSettings.recipientEmail}`,
      `From: Mulyana D-Zign <no-reply@mulyana-dzign.app>`,
      `Subject: ${dispatchStatus.subject || 'Portfolio CV Weekly Summary'}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      dispatchStatus.htmlBody,
    ].join('\r\n');
    const blob = new Blob([eml], { type: 'message/rfc822;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mulyana_Weekly_Digest_${new Date().toISOString().slice(0, 10)}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      <div className="border-b border-[#2B3449] pb-6">
        <p className="text-xs font-medium text-amber-400">
          Document Export Center & Automated Email Digest
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
          PDF/CSV Exports & Weekly Email Notifications
        </h1>
        <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
          Download a PDF copy of your Digital CV, export visitor analytics reports to PDF or CSV, and manage automated weekly account activity summaries.
        </p>
      </div>

      {/* Export Center Grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6">
          <div>
            <FileText className="h-6 w-6 text-[#F58220]" />
            <h2 className="mt-4 font-display text-base font-semibold text-white">
              Export Digital CV (PDF)
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Generates an up-to-date CV document with profile details, work experience, skills, and portfolio projects.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportDigitalCvToPdf(
                profile,
                MULYANA_EXPERIENCE,
                MULYANA_SKILLS,
                MULYANA_ABILITIES,
                portfolioItems
              )
            }
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CV PDF</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6">
          <div>
            <FileText className="h-6 w-6 text-emerald-400" />
            <h2 className="mt-4 font-display text-base font-semibold text-white">
              Original Graphic CV (PDF)
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Open or download your original graphic-designed CV file (3 pages including visual gallery and QR code).
            </p>
          </div>
          <a
            href={MULYANA_CONTACT.originalCvPdfUrl}
            download="Mulyana_CV_Original.pdf"
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Original PDF</span>
          </a>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6">
          <div>
            <Download className="h-6 w-6 text-[#F58220]" />
            <h2 className="mt-4 font-display text-base font-semibold text-white">
              Visitor Analytics Report (PDF)
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Executive PDF report featuring weekly KPI summaries and a complete table of who viewed your profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportAnalyticsToPdf(visits, 'All-Time History Summary', {
                totalVisits: weeklySummary.totalVisits,
                recruiterVisits: weeklySummary.recruiterVisits,
                avgDurationSec: weeklySummary.avgDurationSec,
                topChannel: weeklySummary.topChannel,
              })
            }
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Analytics PDF</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6">
          <div>
            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            <h2 className="mt-4 font-display text-base font-semibold text-white">
              Visitor Log Data (CSV)
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Download the full visitor log ({visits.length} rows) in UTF-8 CSV format for Excel or Google Sheets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportVisitsToCsv(visits)}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV Data</span>
          </button>
        </div>
      </section>

      {/* Weekly Email Digest Configuration + Live Preview */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form
          onSubmit={handleSaveDigestPrefs}
          className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-5 space-y-5"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-400" />
            <h2 className="font-display text-lg font-semibold text-white">
              Weekly Email Digest System
            </h2>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-[#2B3449] bg-[#161B26] px-4 py-3 text-sm font-medium text-slate-200">
            <span>Enable Weekly Email Summary</span>
            <input
              type="checkbox"
              checked={digestSettings.enabled}
              onChange={(e) => updateDigestSettings({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 bg-[#1D2435] text-amber-500 focus:ring-amber-500"
            />
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Delivery Day
              </label>
              <select
                value={digestSettings.dayOfWeek}
                onChange={(e) =>
                  updateDigestSettings({ dayOfWeek: e.target.value as DigestDay })
                }
                className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Time (WIB)
              </label>
              <input
                type="time"
                value={digestSettings.sendHour}
                onChange={(e) => updateDigestSettings({ sendHour: e.target.value })}
                className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white font-mono-tabular focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5 border-t border-[#2B3449] pt-4">
            <label className="flex items-center gap-2.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={digestSettings.includeRecruiterLog}
                onChange={(e) =>
                  updateDigestSettings({ includeRecruiterLog: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-600 bg-[#161B26] text-amber-500 focus:ring-amber-500"
              />
              <span>Include list of recruiters who viewed your profile</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={digestSettings.includeSocialSync}
                onChange={(e) =>
                  updateDigestSettings({ includeSocialSync: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-600 bg-[#161B26] text-amber-500 focus:ring-amber-500"
              />
              <span>Include LinkedIn, Behance & Instagram sync status</span>
            </label>
          </div>

          <div className="border-t border-[#2B3449] pt-4 text-xs text-slate-400 font-mono-tabular">
            Sent: {digestSettings.totalSent} times · Last sent:{' '}
            {new Date(digestSettings.lastSentAt).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="submit"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-semibold text-slate-200 hover:border-slate-500"
            >
              Save Schedule
            </button>
            <button
              type="button"
              onClick={handleSendTestDigest}
              disabled={isSending}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Summary Now'}</span>
            </button>
          </div>

          {dispatchStatus && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{dispatchStatus.message}</span>
              </div>
              {dispatchStatus.htmlBody && (
                <button
                  type="button"
                  onClick={handleDownloadEml}
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 underline hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Email Copy (.eml)</span>
                </button>
              )}
            </div>
          )}
        </form>

        {/* Live Email Preview */}
        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-[#2B3449] pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Weekly Email Summary Preview
              </h2>
              <p className="text-xs text-slate-400">
                To: {emailInput || digestSettings.recipientEmail} · Scheduled every{' '}
                {DAYS.find((d) => d.value === digestSettings.dayOfWeek)?.label || 'Monday'} at{' '}
                {digestSettings.sendHour} WIB
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#2B3449] bg-[#161B26] p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-amber-400">
                MULYANA D-ZIGN · WEEKLY ACTIVITY SUMMARY
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-white">
                Digital CV Performance Report (Last 7 Days)
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Hello {profile.fullName}, here is your weekly summary of recruiter interactions and portfolio reach:
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#2B3449] rounded-lg border border-[#2B3449] bg-[#1D2435]">
              <div className="p-4">
                <p className="text-[11px] text-slate-400">Visits This Week</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-white">
                  {weeklySummary.totalVisits}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-slate-400">Recruiters Active</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#F58220]">
                  {weeklySummary.recruiterVisits}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-slate-400">Top Channel</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {weeklySummary.topChannel}
                </p>
              </div>
            </div>

            {digestSettings.includeRecruiterLog && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-200">
                  Recruiters Who Viewed Your Profile
                </p>
                {weeklySummary.recentRecruiters.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No recruiter visits recorded in the last 7 days.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#2B3449] rounded-lg border border-[#2B3449] bg-[#1D2435]">
                    {weeklySummary.recentRecruiters.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{r.visitorName}</span>{' '}
                          <span className="text-slate-400">
                            · {r.visitorRole} at {r.company}
                          </span>
                        </div>
                        <span className="font-mono-tabular text-slate-400">{r.sourceChannel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {digestSettings.includeSocialSync && (
              <div className="border-t border-[#2B3449] pt-3 text-xs text-slate-300">
                <span className="font-semibold text-white">Featured Work:</span>{' '}
                {weeklySummary.topProject} · LinkedIn, Behance & Instagram sync active.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
