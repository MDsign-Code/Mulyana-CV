import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Check,
  Download,
  FileText,
  Images,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Rows3,
  Search,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MULYANA_ABILITIES,
  MULYANA_CONTACT,
  MULYANA_EXPERIENCE,
  MULYANA_LANGUAGES,
  MULYANA_SKILLS,
} from '../data/mulyanaCvData';
import { usePortfolio } from '../context/PortfolioContext';
import {
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
  type PortfolioItemData,
} from '../types';
import { exportDigitalCvToPdf } from '../utils/exportUtils';
import { PortfolioImage } from './PortfolioImage';
import { PortfolioLightbox } from './PortfolioLightbox';
import { AwardWinnerBadge } from './AwardWinnerBadge';

const CATEGORIES: Array<'All' | PortfolioCategory> = [
  'All',
  ...PORTFOLIO_CATEGORIES,
];

interface DigitalCvViewProps {
  onOpenGalleryManager?: () => void;
}

export const DigitalCvView: React.FC<DigitalCvViewProps> = ({ onOpenGalleryManager }) => {
  const { profile, portfolioItems, trackPublicInteraction, isAdminMode, isAuthorizedAdmin } =
    usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<'All' | PortfolioCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [galleryLayout, setGalleryLayout] = useState<'bento' | 'grid'>('bento');
  const [lightboxItem, setLightboxItem] = useState<PortfolioItemData | null>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set('All', portfolioItems.length);
    for (const item of portfolioItems) {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }
    return counts;
  }, [portfolioItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return portfolioItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [portfolioItems, selectedCategory, searchQuery]);

  const handleExportPdf = () => {
    trackPublicInteraction('Download Digital CV (PDF)');
    exportDigitalCvToPdf(
      profile,
      MULYANA_EXPERIENCE,
      MULYANA_SKILLS,
      MULYANA_ABILITIES,
      portfolioItems
    );
  };

  const qrTargets = [
    {
      label: 'Behance Portfolio',
      handle: profile.behanceUrl.replace(/^https?:\/\/(www\.)?/, ''),
      url: profile.behanceUrl,
    },
    {
      label: 'LinkedIn Profile',
      handle: profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''),
      url: profile.linkedinUrl,
    },
    {
      label: 'Instagram Studio',
      handle: profile.instagramUrl.replace(/^https?:\/\/(www\.)?/, ''),
      url: profile.instagramUrl,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-16">
      {/* Split Hero Section */}
      <section
        id="profile"
        className="scroll-mt-20 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch"
      >
        <div className="flex flex-col justify-between lg:col-span-7 space-y-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={MULYANA_CONTACT.logoUrl}
                  alt="Mulyana D-Zign Logo"
                  className="h-10 w-10 rounded-lg border border-[#2B3449] bg-[#1D2435] object-contain p-1"
                  referrerPolicy="no-referrer"
                />
                <p className="text-xs font-medium tracking-wide text-amber-400">
                  {profile.brandName} · {profile.location}
                </p>
              </div>

              <a
                href="#awards"
                onClick={() => trackPublicInteraction('Hero 100+ Award Badge')}
                className="shrink-0 focus-visible:outline-2 focus-visible:outline-amber-500 rounded-xl"
              >
                <AwardWinnerBadge count={profile.awardsCount} size="compact" />
              </a>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
              <span className="text-[#F58220]">{profile.fullName}</span> — {profile.tagline}
            </h1>

            <p className="text-base leading-relaxed text-slate-300 max-w-2xl">
              {profile.bio}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300 pt-1">
              <a
                href={`mailto:${MULYANA_CONTACT.email}`}
                className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
              >
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>{MULYANA_CONTACT.email}</span>
              </a>
              <span aria-hidden="true" className="text-slate-600">
                /
              </span>
              <a
                href={MULYANA_CONTACT.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors font-mono-tabular"
              >
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>{MULYANA_CONTACT.phone}</span>
              </a>
              <span aria-hidden="true" className="text-slate-600">
                /
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{profile.location}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#F58220] px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Download Digital CV (PDF)</span>
            </button>

            <a
              href={MULYANA_CONTACT.originalCvPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#2B3449] bg-[#1D2435] px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
            >
              <FileText className="h-4 w-4" />
              <span>View Original CV (PDF)</span>
            </a>

            <div className="flex items-center gap-4 pl-2 text-sm font-medium text-slate-300">
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={profile.behanceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                <span>Behance</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                <span>Instagram</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Right visual showcase matching height */}
        <div className="lg:col-span-5">
          <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-[#2B3449] bg-[#1D2435]">
            <img
              src={MULYANA_CONTACT.portraitUrl}
              alt="Portrait of Mulyana, Graphic Designer"
              className="h-full w-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#11151F]/95 via-[#11151F]/65 to-transparent p-6 text-white">
              <p className="text-xs font-medium text-amber-400">
                Graphic Designer · Publishing & Branding
              </p>
              <p className="mt-1 font-display text-xl font-semibold">
                {profile.headline}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width 3-column Proof Strip below Hero */}
      <section className="grid grid-cols-1 divide-y divide-[#2B3449] rounded-2xl border border-[#2B3449] bg-[#1D2435] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Industry Experience</p>
          <p className="mt-2 font-mono-tabular text-3xl font-semibold text-white">
            {profile.yearsExperience}+ yrs
          </p>
          <p className="mt-1 text-xs text-slate-400">Since Feb 2007 across publishing & agencies</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Award-Winning Track Record</p>
          <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#F58220]">
            {profile.awardsCount}+
          </p>
          <p className="mt-1 text-xs text-slate-400">International design contest victories</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-slate-400">Core Specializations</p>
          <p className="mt-2 font-display text-xl font-semibold text-white leading-snug">
            Advertising, Book Design, Packaging
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Print, Amazon KDP, EPUB & commercial branding
          </p>
        </div>
      </section>

      {/* Dedicated Highlight: 100+ Award-Winning Design Contests */}
      <section
        id="awards"
        className="scroll-mt-20 relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-[#1D2435] via-[#1B2233] to-[#141925] p-8 sm:p-10"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center lg:max-w-3xl">
            <AwardWinnerBadge count={profile.awardsCount} size="showcase" />

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Proven Competitive Excellence · 99designs Global Track Record
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {profile.awardsCount}+ Award-Winning Design Contests Worldwide
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                Selected as 1st-place winner in over {profile.awardsCount} international blind design competitions against global studios—spanning Book Covers &amp; Amazon KDP Interiors, Retail Packaging Dielines, Corporate Brand Identities, and Executive Pitch Decks.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href={MULYANA_CONTACT.profile99designsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackPublicInteraction('Verify 100+ 99designs Wins')}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap"
                >
                  <Award className="h-4 w-4" />
                  <span>Verify 99designs Contest Record</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>

                <a
                  href="#portfolio"
                  className="inline-flex h-10 items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  <span>Explore Winning Works</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#2B3449] rounded-xl border border-[#2B3449] bg-[#161B26]/85 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:w-80 lg:grid-cols-1 lg:divide-x-0 lg:divide-y shrink-0">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">1st-Place Victories</p>
                <p className="text-[11px] text-slate-500">Global blind competitions</p>
              </div>
              <span className="font-mono-tabular text-2xl font-bold text-[#F58220]">
                {profile.awardsCount}+
              </span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Client Satisfaction</p>
                <p className="text-[11px] text-slate-500">Verified repeat reviews</p>
              </div>
              <span className="font-mono-tabular text-2xl font-bold text-emerald-400">
                5.0 ★
              </span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Winning Disciplines</p>
                <p className="text-[11px] text-slate-500">Books · Packaging · Decks</p>
              </div>
              <span className="font-mono-tabular text-xl font-bold text-white">
                4 Tracks
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Capabilities Two-Column Layout */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div id="experience" className="scroll-mt-20 lg:col-span-7 space-y-6">
          <div className="border-b border-[#2B3449] pb-4">
            <h2 className="font-display text-2xl font-semibold text-white">
              Professional Experience
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Career journey across publishing houses, advertising agencies, entertainment venues, and global clients.
            </p>
          </div>

          <div className="divide-y divide-[#2B3449]">
            {MULYANA_EXPERIENCE.map((exp) => (
              <article key={exp.id} className="py-6 first:pt-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-amber-400">
                    {exp.company}
                  </h3>
                  <span className="font-mono-tabular text-xs font-medium text-slate-300">
                    {exp.period}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {exp.role} · <span className="text-slate-400 font-normal">{exp.location}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{exp.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {exp.highlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F58220]" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        {/* Right Column: Tools, Abilities & Languages */}
        <div id="skills" className="scroll-mt-20 lg:col-span-5 space-y-8">
          <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                Tools & Production Proficiency
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Print production, KDP book interiors, EPUB formats, 3D packaging, and executive decks.
              </p>
            </div>

            <div className="space-y-4">
              {MULYANA_SKILLS.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-100">{skill.name}</span>
                    <span className="font-mono-tabular text-xs text-slate-400">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#2B3449]">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{skill.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Core Services & Capabilities
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                End-to-end visual design solutions for publishing, branding, and marketing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {MULYANA_ABILITIES.map((ability, idx) => (
                <div
                  key={ability}
                  className="flex items-center gap-2.5 border-b border-[#2B3449] pb-2 text-sm text-slate-200"
                >
                  <span className="font-mono-tabular text-xs text-[#F58220]">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{ability}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2B3449]">
              <p className="text-xs font-medium text-slate-400 mb-2">Languages</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-100">
                {MULYANA_LANGUAGES.map((lang, idx) => (
                  <React.Fragment key={lang.name}>
                    <span>
                      {lang.name}{' '}
                      <span className="text-xs text-slate-400">({lang.proficiency})</span>
                    </span>
                    {idx < MULYANA_LANGUAGES.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Gallery & Case Studies with Bento / Grid & Lightbox */}
      <section id="portfolio" className="scroll-mt-20 space-y-6">
        <div className="flex flex-col gap-5 border-b border-[#2B3449] pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium text-amber-400">
                Visual Showcase ·{' '}
                <span className="font-mono-tabular">{portfolioItems.length}</span> Curated Works
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                Work Gallery &amp; Case Studies
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Advertising campaigns, KDP &amp; editorial book design, retail packaging, corporate profiles, and exhibition booths.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or clients..."
                  aria-label="Search work gallery"
                  className="h-9 w-full rounded-lg border border-[#2B3449] bg-[#1D2435] pl-8 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div
                className="inline-flex items-center rounded-lg border border-[#2B3449] bg-[#1D2435] p-0.5"
                role="group"
                aria-label="Gallery layout"
              >
                <button
                  type="button"
                  onClick={() => setGalleryLayout('bento')}
                  aria-label="Bento layout"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                    galleryLayout === 'bento'
                      ? 'bg-[#2B3449] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  <span>Bento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryLayout('grid')}
                  aria-label="Uniform grid layout"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                    galleryLayout === 'grid'
                      ? 'bg-[#2B3449] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              {isAdminMode && isAuthorizedAdmin && onOpenGalleryManager && (
                <button
                  type="button"
                  onClick={onOpenGalleryManager}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#F58220] px-3.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>Manage Gallery</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-[#2B3449] bg-[#1D2435] p-1">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts.get(cat) || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#F58220] text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      selectedCategory === cat ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-10 text-center space-y-3">
            <p className="font-display text-lg font-semibold text-white">
              No projects found in this view
            </p>
            <p className="text-xs text-slate-400">
              Try selecting another discipline or clearing your search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="inline-flex h-9 items-center rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-medium text-amber-400 hover:border-amber-500/60"
            >
              Show All Projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, idx) => {
              const isHeroBento =
                galleryLayout === 'bento' && idx === 0 && filteredItems.length >= 4;
              return (
                <article
                  key={item.id}
                  onClick={() => {
                    setLightboxItem(item);
                    trackPublicInteraction(item.title);
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border border-[#2B3449] bg-[#1D2435] transition-colors hover:border-amber-500/50 ${
                    isHeroBento ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div
                    className={`relative overflow-hidden bg-[#121722] ${
                      isHeroBento ? 'aspect-[16/9]' : 'aspect-[4/3]'
                    }`}
                  >
                    <PortfolioImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-amber-400">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.sourcePlatform}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{item.year}</span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-400">{item.client}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-300">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-[#2B3449] pt-3 text-xs text-slate-400 font-mono-tabular">
                      <span>
                        {item.views.toLocaleString('en-US')} views · {item.likes} likes
                      </span>
                      <span className="inline-flex items-center gap-1 font-sans font-medium text-slate-200 group-hover:text-amber-400">
                        View in Gallery
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Instagram @mulya_dzign Direct Studio Strip */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[#2B3449] bg-[#1D2435] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-400">
              Instagram Studio Feed · @mulya_dzign
            </p>
            <p className="text-sm text-slate-200">
              Explore daily design reels, book cover mockups, and packaging snapshots directly on Instagram.
            </p>
          </div>
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackPublicInteraction('Open Instagram @mulya_dzign')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-500/40 bg-[#161B26] px-4 text-xs font-semibold text-amber-300 transition-colors hover:border-amber-400 hover:text-white whitespace-nowrap shrink-0"
          >
            <span>Open @mulya_dzign on Instagram</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Scan to My Portfolio (QR Codes matching CV Page 2) */}
      <section className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-400">
              <Award className="h-4 w-4" />
              <span>100+ Award-Winning Designs · Instant Network Access</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-white">
              Scan or Click for another Portfolio
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Recruiters and clients can scan these QR codes or click any card to jump directly to Mulyana D-Zign profiles on Behance, LinkedIn, or Instagram.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {qrTargets.map((qr) => (
              <a
                key={qr.label}
                href={qr.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center rounded-xl border border-[#2B3449] bg-[#161B26] p-4 text-center transition-colors hover:border-amber-500/60"
              >
                <div className="rounded-lg bg-white p-2.5">
                  <QRCodeSVG value={qr.url} size={96} level="M" />
                </div>
                <p className="mt-3 text-xs font-semibold text-white">{qr.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-400 truncate max-w-[140px]">
                  {qr.handle}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox Modal with Prev/Next Filmstrip */}
      <PortfolioLightbox
        items={filteredItems}
        activeItem={lightboxItem}
        onSelectItem={(next) => {
          setLightboxItem(next);
          trackPublicInteraction(next.title);
        }}
        onClose={() => setLightboxItem(null)}
      />
    </div>
  );
};
