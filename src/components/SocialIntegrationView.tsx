import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePortfolio } from '../context/PortfolioContext';
import type { SocialSyncResponse } from '../types';

export const SocialIntegrationView: React.FC = () => {
  const {
    profile,
    updateProfileSettings,
    socialStatuses,
    isSyncingSocial,
    syncSocialPlatforms,
    portfolioItems,
    addPortfolioItem,
  } = usePortfolio();

  const [linkedinInput, setLinkedinInput] = useState(profile.linkedinUrl);
  const [behanceInput, setBehanceInput] = useState(profile.behanceUrl);
  const [instagramInput, setInstagramInput] = useState(profile.instagramUrl);
  const [lastSyncData, setLastSyncData] = useState<SocialSyncResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const appOrigin =
    typeof window !== 'undefined'
      ? `${window.location.origin}${basePath}`
      : 'https://mulyana-dzign.app';

  const handleSyncNow = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await syncSocialPlatforms({
      linkedinUrl: linkedinInput.trim(),
      behanceUrl: behanceInput.trim(),
      instagramUrl: instagramInput.trim(),
    });
    if (res) setLastSyncData(res);
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const utmChannels = [
    {
      key: 'linkedin',
      label: 'LinkedIn Profile Link (Featured / Bio)',
      url: `${appOrigin}/?src=linkedin&role=recruiter`,
      description: 'Tags visitors arriving from LinkedIn as potential recruiters.',
    },
    {
      key: 'behance',
      label: 'Behance Profile Link',
      url: `${appOrigin}/?src=behance`,
      description: 'Tracks clicks from Behance project galleries to your digital CV.',
    },
    {
      key: 'instagram',
      label: 'Instagram Link-in-Bio URL',
      url: `${appOrigin}/?src=instagram`,
      description: 'Measures client and creative audience reach from @mulya_dzign.',
    },
    {
      key: 'email',
      label: 'Email Signature & Proposal Link',
      url: `${appOrigin}/?src=email`,
      description: 'Attributes traffic from client proposals and job applications.',
    },
  ];

  const embedSnippet = `<a href="${appOrigin}/?src=linkedin&role=recruiter" target="_blank" rel="noopener">View Mulyana D-Zign Digital CV Portfolio (15+ Years Experience)</a>`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col gap-4 border-b border-[#2B3449] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Social Media Integration & Network Reach
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
            LinkedIn, Instagram & Behance Connections
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
            Sync your portfolio projects and professional history automatically in real time, and expand your network reach with UTM tracking links and QR cards.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-[#2B3449] bg-[#1D2435] px-4 py-2.5 text-xs font-medium text-slate-200">
          <input
            type="checkbox"
            checked={profile.autoSyncEnabled}
            onChange={(e) => updateProfileSettings({ autoSyncEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-600 bg-[#161B26] text-amber-500 focus:ring-amber-500"
          />
          <span>Real-Time Auto-Sync</span>
        </label>
      </div>

      {/* Social Connections Editor + Live Status */}
      <form onSubmit={handleSyncNow} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {socialStatuses.map((status) => {
            const value =
              status.platform === 'LinkedIn'
                ? linkedinInput
                : status.platform === 'Behance'
                ? behanceInput
                : instagramInput;
            const onChange =
              status.platform === 'LinkedIn'
                ? setLinkedinInput
                : status.platform === 'Behance'
                ? setBehanceInput
                : setInstagramInput;

            return (
              <div
                key={status.platform}
                className="flex flex-col justify-between rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-white">
                      {status.platform}
                    </h2>
                    <span className="text-xs font-medium text-emerald-400">
                      {status.connected ? 'Connected' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-mono-tabular">
                    {status.handle} · {status.syncedItemsCount} items synced
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {status.platform} Profile URL
                    </label>
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      required
                      className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {status.statusNote}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#2B3449] pt-3 text-xs text-slate-400">
                  <span className="font-mono-tabular">
                    Checked:{' '}
                    {new Date(status.lastCheckedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300"
                  >
                    <span>Open Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#2B3449] bg-[#1D2435] px-6 py-4">
          <p className="text-xs text-slate-300 font-mono-tabular">
            Last synchronized:{' '}
            {new Date(profile.lastSyncedAt).toLocaleString('en-US', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <button
            type="submit"
            disabled={isSyncingSocial}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSocial ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingSocial
                ? 'Syncing LinkedIn, Behance & IG...'
                : 'Sync & Save Profiles Now'}
            </span>
          </button>
        </div>
      </form>

      {/* Discovered Projects */}
      {lastSyncData && lastSyncData.discoveredProjects.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Discovered Projects from Live Sync
            </h2>
            <p className="text-xs text-slate-400">
              Add newly discovered works from Behance or Instagram directly to your Digital CV gallery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {lastSyncData.discoveredProjects.map((proj) => {
              const alreadyExists =
                addedTitles.has(proj.title) ||
                portfolioItems.some((p) => p.title.toLowerCase() === proj.title.toLowerCase());
              return (
                <div
                  key={proj.title}
                  className="flex items-start gap-4 rounded-xl border border-[#2B3449] bg-[#1D2435] p-4"
                >
                  <img
                    src={proj.imageUrl}
                    alt={proj.title}
                    className="h-20 w-24 shrink-0 rounded-lg object-cover bg-[#161B26]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-amber-400 font-medium">
                      {proj.sourcePlatform} · {proj.year}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-white truncate">
                      {proj.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">{proj.description}</p>
                    <button
                      type="button"
                      disabled={alreadyExists}
                      onClick={async () => {
                        await addPortfolioItem({
                          title: proj.title,
                          client: proj.client,
                          category: proj.category,
                          sourcePlatform: proj.sourcePlatform,
                          year: proj.year,
                          description: proj.description,
                          imageUrl: proj.imageUrl,
                          externalUrl: proj.externalUrl,
                          views: 120,
                          likes: 18,
                          featured: false,
                        });
                        setAddedTitles((prev) => new Set(prev).add(proj.title));
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-[#2B3449] bg-[#161B26] px-3 py-1 text-xs font-medium text-slate-200 hover:border-amber-500/60 disabled:opacity-50"
                    >
                      {alreadyExists ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Added to CV Gallery</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to CV Gallery</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Network Expansion & UTM Reach Hub */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-8 space-y-5">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-amber-400" />
            <h2 className="font-display text-lg font-semibold text-white">
              Expand Your Professional Network (Tracked Links)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Place dedicated tracking links in your LinkedIn bio, Behance, Instagram, or email signature so every recruiter and client visit is logged automatically.
          </p>

          <div className="divide-y divide-[#2B3449]">
            {utmChannels.map((ch) => (
              <div
                key={ch.key}
                className="flex flex-col gap-3 py-4 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{ch.label}</p>
                  <p className="text-xs text-slate-400">{ch.description}</p>
                  <p className="mt-1 font-mono-tabular text-xs text-amber-300 truncate">
                    {ch.url}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(ch.key, ch.url)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#2B3449] bg-[#161B26] px-3.5 text-xs font-medium text-slate-200 hover:border-amber-500/60"
                >
                  {copiedKey === ch.key ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2B3449] pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-200">
                HTML Link Snippet for Website / Blog
              </p>
              <button
                type="button"
                onClick={() => handleCopy('embed', embedSnippet)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                {copiedKey === 'embed' ? 'HTML Code Copied' : 'Copy HTML Code'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-[#2B3449] bg-[#121722] p-3 font-mono-tabular text-[11px] text-slate-300">
              {embedSnippet}
            </pre>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 lg:col-span-4 flex flex-col items-center justify-between text-center">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-white">
              Digital Business Card QR
            </h2>
            <p className="text-xs text-slate-400">
              Scan to open the Digital CV Portfolio directly from printed business cards or client pitch decks.
            </p>
          </div>

          <div className="my-6 rounded-xl border border-[#2B3449] bg-[#161B26] p-5">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={`${appOrigin}/?src=qr`} size={160} level="M" />
            </div>
            <p className="mt-3 text-xs font-semibold text-white">{profile.fullName}</p>
            <p className="text-[11px] text-slate-400">{profile.brandName}</p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('qr_url', `${appOrigin}/?src=qr`)}
            className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            {copiedKey === 'qr_url' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>QR Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Direct QR Link</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
