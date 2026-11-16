import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Search,
  UserPlus,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { SourceChannel, VisitorRole } from '../types';
import { exportAnalyticsToPdf, exportVisitsToCsv } from '../utils/exportUtils';

const CHANNEL_OPTIONS: Array<'All' | SourceChannel> = [
  'All',
  'LinkedIn',
  'Behance',
  'Instagram',
  'Direct / QR',
  'Email Link',
];

export const AnalyticsDashboardView: React.FC = () => {
  const {
    user,
    isSigningIn,
    signInWithGoogle,
    signOutUser,
    visits,
    simulateRecruiterVisit,
    isLoadingData,
  } = usePortfolio();

  const [trendMode, setTrendMode] = useState<'weekly' | 'monthly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'recruiters' | 'others'>('all');
  const [channelFilter, setChannelFilter] = useState<'All' | SourceChannel>('All');

  const [simName, setSimName] = useState('Aulia Rahman');
  const [simRole, setSimRole] = useState<VisitorRole>('Recruiter');
  const [simCompany, setSimCompany] = useState('Bukalapak Design Guild');
  const [simChannel, setSimChannel] = useState<SourceChannel>('LinkedIn');
  const [simSection, setSimSection] = useState('Experience & Packaging Portfolio');
  const [isSimulating, setIsSimulating] = useState(false);

  const daysWindow = trendMode === 'weekly' ? 7 : 30;

  const filteredVisitsByPeriod = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (daysWindow - 1));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return visits.filter((v) => v.visitDate >= cutoffStr);
  }, [visits, daysWindow]);

  const summary = useMemo(() => {
    const list = filteredVisitsByPeriod;
    const totalVisits = list.length;
    const recruiterVisits = list.filter((v) => v.isRecruiter).length;
    const avgDurationSec =
      totalVisits > 0
        ? Math.round(list.reduce((acc, v) => acc + v.durationSeconds, 0) / totalVisits)
        : 0;

    const counts: Record<string, number> = {};
    for (const v of list) {
      counts[v.sourceChannel] = (counts[v.sourceChannel] || 0) + 1;
    }
    const topChannel =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'LinkedIn';

    return { totalVisits, recruiterVisits, avgDurationSec, topChannel };
  }, [filteredVisitsByPeriod]);

  const trendSeries = useMemo(() => {
    if (trendMode === 'weekly') {
      const points: Array<{ label: string; total: number; recruiters: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const dayVisits = visits.filter((v) => v.visitDate === iso);
        points.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' }),
          total: dayVisits.length,
          recruiters: dayVisits.filter((v) => v.isRecruiter).length,
        });
      }
      return points;
    }

    const buckets: Array<{ label: string; total: number; recruiters: number }> = [];
    for (let w = 3; w >= 0; w--) {
      const endOffset = w * 7;
      const startOffset = endOffset + 6;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startOffset);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - endOffset);

      const startIso = startDate.toISOString().slice(0, 10);
      const endIso = endDate.toISOString().slice(0, 10);
      const inBucket = visits.filter((v) => v.visitDate >= startIso && v.visitDate <= endIso);
      buckets.push({
        label: `${startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`,
        total: inBucket.length,
        recruiters: inBucket.filter((v) => v.isRecruiter).length,
      });
    }
    return buckets;
  }, [visits, trendMode]);

  const channelChartData = useMemo(() => {
    const channels: SourceChannel[] = [
      'LinkedIn',
      'Behance',
      'Instagram',
      'Direct / QR',
      'Email Link',
    ];
    return channels.map((ch) => ({
      channel: ch,
      visits: filteredVisitsByPeriod.filter((v) => v.sourceChannel === ch).length,
    }));
  }, [filteredVisitsByPeriod]);

  const filteredTableVisits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visits.filter((v) => {
      if (roleFilter === 'recruiters' && !v.isRecruiter) return false;
      if (roleFilter === 'others' && v.isRecruiter) return false;
      if (channelFilter !== 'All' && v.sourceChannel !== channelFilter) return false;
      if (!q) return true;
      return (
        v.visitorName.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.sectionViewed.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
      );
    });
  }, [visits, searchQuery, roleFilter, channelFilter]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim() || !simCompany.trim()) return;
    setIsSimulating(true);
    try {
      await simulateRecruiterVisit({
        visitorName: simName.trim(),
        visitorRole: simRole,
        company: simCompany.trim(),
        location: 'Jakarta, ID',
        sourceChannel: simChannel,
        sectionViewed: simSection.trim() || 'Digital CV & Portfolio',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header & Auth / Export Toolbar */}
      <div className="flex flex-col gap-5 border-b border-[#2B3449] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Visitor Analytics Dashboard · Live Monitoring
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
            Visit Trends & Recruiter Detection
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            Monitor who views your profile from LinkedIn, Behance, and Instagram across weekly and monthly summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportVisitsToCsv(filteredTableVisits)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2B3449] bg-[#1D2435] px-4 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportAnalyticsToPdf(
                filteredTableVisits,
                trendMode === 'weekly' ? 'Last 7 Days (Weekly)' : 'Last 30 Days (Monthly)',
                summary
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Export Analytics PDF</span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2B3449] bg-[#161B26] px-3.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out ({user.email?.split('@')[0]})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google (Admin)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 divide-y divide-[#2B3449] rounded-2xl border border-[#2B3449] bg-[#1D2435] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">
            Total Visits ({trendMode === 'weekly' ? '7 Days' : '30 Days'})
          </p>
          <p className="mt-2 font-mono-tabular text-3xl font-semibold text-white">
            {isLoadingData ? '—' : summary.totalVisits}
          </p>
          <p className="mt-1 text-xs text-slate-400">Profile & portfolio views</p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Recruiters & Hiring Managers</p>
          <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#F58220]">
            {isLoadingData ? '—' : summary.recruiterVisits}
          </p>
          <p className="mt-1 text-xs text-slate-400">Triggers real-time alerts</p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Avg. Read Duration</p>
          <p className="mt-2 font-mono-tabular text-3xl font-semibold text-emerald-400">
            {isLoadingData ? '—' : `${summary.avgDurationSec} sec`}
          </p>
          <p className="mt-1 text-xs text-slate-400">Review time per session</p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Top Referral Channel</p>
          <p className="mt-2 font-display text-2xl font-semibold text-white truncate">
            {summary.topChannel}
          </p>
          <p className="mt-1 text-xs text-slate-400">Dominant traffic source</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                {trendMode === 'weekly' ? 'Weekly Visit Trend (7 Days)' : 'Monthly Visit Trend (30 Days)'}
              </h2>
              <p className="text-xs text-slate-400">
                Comparison of total profile visits versus recruiter-category visits.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[#2B3449] bg-[#161B26] p-1">
              <button
                type="button"
                onClick={() => setTrendMode('weekly')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  trendMode === 'weekly'
                    ? 'bg-[#F58220] text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTrendMode('monthly')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  trendMode === 'monthly'
                    ? 'bg-[#F58220] text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitTotalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitRecruiterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F58220" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F58220" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3449" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B26',
                    borderRadius: '8px',
                    border: '1px solid #2B3449',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Visits"
                  stroke="#4ADE80"
                  strokeWidth={2}
                  fill="url(#visitTotalGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="recruiters"
                  name="Recruiters / Hiring Managers"
                  stroke="#F58220"
                  strokeWidth={2}
                  fill="url(#visitRecruiterGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-4">
          <h2 className="font-display text-lg font-semibold text-white">
            Traffic Channel Breakdown
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Distribution of visits from social networks and direct links.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelChartData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3449" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  width={84}
                  tick={{ fontSize: 11, fill: '#CBD5E1' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B26',
                    borderRadius: '8px',
                    border: '1px solid #2B3449',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="visits" name="Visits" fill="#F58220" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Recruiter Visit Simulator */}
      <form
        onSubmit={handleSimulate}
        className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 space-y-4"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Test Real-Time Recruiter Notification System
            </h2>
            <p className="text-xs text-slate-400">
              Trigger a simulated recruiter visit to test instant toast alerts, notification bell updates, and Firestore logging.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            type="text"
            value={simName}
            onChange={(e) => setSimName(e.target.value)}
            placeholder="Recruiter Name"
            aria-label="Recruiter Name"
            className="h-10 rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <select
            value={simRole}
            onChange={(e) => setSimRole(e.target.value as VisitorRole)}
            aria-label="Visitor Role"
            className="h-10 rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="Recruiter">Recruiter</option>
            <option value="Hiring Manager">Hiring Manager</option>
            <option value="Creative Director">Creative Director</option>
            <option value="Client">Client</option>
          </select>
          <input
            type="text"
            value={simCompany}
            onChange={(e) => setSimCompany(e.target.value)}
            placeholder="Company"
            aria-label="Company Name"
            className="h-10 rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <select
            value={simChannel}
            onChange={(e) => setSimChannel(e.target.value as SourceChannel)}
            aria-label="Source Channel"
            className="h-10 rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="LinkedIn">LinkedIn</option>
            <option value="Behance">Behance</option>
            <option value="Instagram">Instagram</option>
            <option value="Direct / QR">Direct / QR</option>
            <option value="Email Link">Email Link</option>
          </select>
          <input
            type="text"
            value={simSection}
            onChange={(e) => setSimSection(e.target.value)}
            placeholder="Section Viewed"
            aria-label="Profile Section Viewed"
            className="h-10 rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSimulating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isSimulating ? 'Sending...' : 'Trigger Visit'}</span>
          </button>
        </div>
      </form>

      {/* Visitor Log Table */}
      <section className="rounded-2xl border border-[#2B3449] bg-[#1D2435] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#2B3449] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Who Viewed Your Profile
            </h2>
            <p className="text-xs text-slate-400 font-mono-tabular">
              Showing {filteredTableVisits.length} of {visits.length} visit records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, company..."
                aria-label="Search visitors"
                className="h-9 w-56 rounded-lg border border-[#2B3449] bg-[#161B26] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[#2B3449] bg-[#161B26] p-1">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  roleFilter === 'all' ? 'bg-[#F58220] text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('recruiters')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  roleFilter === 'recruiters'
                    ? 'bg-[#F58220] text-slate-950 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                Recruiters
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('others')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  roleFilter === 'others'
                    ? 'bg-[#F58220] text-slate-950 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                Clients & Peers
              </button>
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as 'All' | SourceChannel)}
              aria-label="Filter channel"
              className="h-9 rounded-lg border border-[#2B3449] bg-[#161B26] px-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              {CHANNEL_OPTIONS.map((ch) => (
                <option key={ch} value={ch}>
                  Channel: {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2B3449] bg-[#161B26] text-xs font-semibold text-slate-300">
                <th className="py-3 pl-6 pr-4">Visitor & Company</th>
                <th className="px-4 py-3">Role Category</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Section Viewed</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="py-3 pl-4 pr-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3449] text-sm">
              {filteredTableVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No visit records match your current search filter.
                  </td>
                </tr>
              ) : (
                filteredTableVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-[#242D42] transition-colors">
                    <td className="py-3.5 pl-6 pr-4">
                      <p className="font-medium text-white">{visit.visitorName}</p>
                      <p className="text-xs text-slate-400">
                        {visit.company} · {visit.location}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          visit.isRecruiter ? 'text-amber-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {visit.visitorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      {visit.sourceChannel} · {visit.device}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-300 max-w-xs truncate">
                      {visit.sectionViewed}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular text-xs text-slate-200">
                      {visit.durationSeconds} sec
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right font-mono-tabular text-xs text-slate-400">
                      {visit.visitDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
