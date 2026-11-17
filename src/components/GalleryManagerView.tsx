import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  Eye,
  ImagePlus,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { DEFAULT_PORTFOLIO_ITEMS, assetUrl } from '../data/mulyanaCvData';
import {
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
  type PortfolioItemData,
  type SocialPlatform,
} from '../types';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { PortfolioImage } from './PortfolioImage';
import { PortfolioLightbox } from './PortfolioLightbox';

const PLATFORMS: SocialPlatform[] = ['CV Archive', 'Behance', 'Instagram', 'LinkedIn'];

interface FormState {
  id: string | null;
  title: string;
  client: string;
  category: PortfolioCategory;
  sourcePlatform: SocialPlatform;
  year: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: '',
  client: '',
  category: 'Packaging',
  sourcePlatform: 'CV Archive',
  year: String(new Date().getFullYear()),
  description: '',
  imageUrl: assetUrl('/assets/portfolio/work_algoplay_packaging.png'),
  externalUrl: 'https://www.behance.net/md_dzign',
  featured: true,
};

export const GalleryManagerView: React.FC = () => {
  const {
    profile,
    portfolioItems,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    syncDefaultPortfolioItems,
  } = usePortfolio();

  const [selectedCategory, setSelectedCategory] = useState<'All' | PortfolioCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageMeta, setImageMeta] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItemData | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [igUrlInput, setIgUrlInput] = useState('');
  const [isImportingIg, setIsImportingIg] = useState(false);
  const [igImportNote, setIgImportNote] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const missingDefaultsCount = useMemo(() => {
    const titles = new Set(portfolioItems.map((p) => p.title.toLowerCase()));
    return DEFAULT_PORTFOLIO_ITEMS.filter((d) => !titles.has(d.title.toLowerCase())).length;
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

  const totalViews = useMemo(
    () => portfolioItems.reduce((acc, item) => acc + item.views, 0),
    [portfolioItems]
  );

  const featuredCount = useMemo(
    () => portfolioItems.filter((item) => item.featured).length,
    [portfolioItems]
  );

  const activeCategoriesCount = useMemo(
    () => new Set(portfolioItems.map((item) => item.category)).size,
    [portfolioItems]
  );

  const showNotice = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const openCreateModal = () => {
    setForm({
      ...EMPTY_FORM,
      externalUrl: profile.behanceUrl || 'https://www.behance.net/md_dzign',
    });
    setImageMeta(null);
    setFormError(null);
    setIgUrlInput('');
    setIgImportNote(null);
    setModalOpen(true);
  };

  const handleImportInstagramUrl = async () => {
    const trimmed = igUrlInput.trim();
    if (!trimmed) return;
    setIsImportingIg(true);
    setIgImportNote(null);
    setFormError(null);

    try {
      const resp = await fetch('/api/social/instagram-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl: trimmed }),
      });
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setForm((prev) => ({
          ...prev,
          sourcePlatform: 'Instagram',
          externalUrl: trimmed,
        }));
        setIgImportNote(
          'Post link saved to Project Link (Instagram). Please upload the artwork image file below to complete the entry.'
        );
        return;
      }

      const data = (await resp.json()) as {
        ok: boolean;
        title?: string;
        description?: string;
        imageUrl?: string;
        externalUrl?: string;
        message?: string;
      };

      if (data.ok && data.imageUrl) {
        setForm((prev) => ({
          ...prev,
          title: prev.title || data.title || 'Instagram Studio Work',
          client: prev.client || 'Mulyana D-Zign (@mulya_dzign)',
          sourcePlatform: 'Instagram',
          description: prev.description || data.description || '',
          imageUrl: data.imageUrl || prev.imageUrl,
          externalUrl: data.externalUrl || trimmed,
        }));
        setIgImportNote('Loaded public Instagram post details. Review fields and click Publish.');
      } else {
        setForm((prev) => ({
          ...prev,
          sourcePlatform: 'Instagram',
          externalUrl: data.externalUrl || trimmed,
        }));
        setIgImportNote(
          data.message ||
            'Instagram restricts automated scraping. Link saved—upload your artwork image below.'
        );
      }
    } catch {
      setForm((prev) => ({
        ...prev,
        sourcePlatform: 'Instagram',
        externalUrl: trimmed,
      }));
      setIgImportNote(
        'Instagram link attached. Upload the artwork image file below to publish.'
      );
    } finally {
      setIsImportingIg(false);
    }
  };

  const openEditModal = (item: PortfolioItemData) => {
    setForm({
      id: item.id,
      title: item.title,
      client: item.client,
      category: item.category,
      sourcePlatform: item.sourcePlatform,
      year: item.year,
      description: item.description,
      imageUrl: item.imageUrl,
      externalUrl: item.externalUrl,
      featured: item.featured,
    });
    setImageMeta(
      item.imageUrl.startsWith('data:image')
        ? `Uploaded image (${Math.round((item.imageUrl.length * 3) / 4 / 1024)} KB)`
        : null
    );
    setFormError(null);
    setModalOpen(true);
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    setIsCompressing(true);
    try {
      const result = await compressImageToDataUrl(file);
      setForm((prev) => ({ ...prev, imageUrl: result.dataUrl }));
      setImageMeta(
        `${result.width}×${result.height}px · ${Math.max(1, Math.round(result.approxBytes / 1024))} KB`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to process image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim() || !form.client.trim() || !form.description.trim()) {
      setFormError('Title, client name, and project description are required.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setFormError('Please upload an artwork image or provide an image URL.');
      return;
    }

    setIsSaving(true);
    try {
      if (form.id) {
        await updatePortfolioItem(form.id, {
          title: form.title.trim(),
          client: form.client.trim(),
          category: form.category,
          sourcePlatform: form.sourcePlatform,
          year: form.year.trim() || String(new Date().getFullYear()),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          externalUrl: form.externalUrl.trim(),
          featured: form.featured,
        });
        showNotice(`Updated "${form.title.trim()}" in your portfolio gallery.`);
      } else {
        await addPortfolioItem({
          title: form.title.trim(),
          client: form.client.trim(),
          category: form.category,
          sourcePlatform: form.sourcePlatform,
          year: form.year.trim() || String(new Date().getFullYear()),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          externalUrl: form.externalUrl.trim(),
          views: 1,
          likes: 0,
          featured: form.featured,
        });
        showNotice(`Added "${form.title.trim()}" to your live public gallery.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save work to gallery.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#2B3449] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Portfolio Curation & Publishing
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
            Work Gallery Manager
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
            Add new design works, upload artwork images, organize categories, and choose featured projects displayed in your public Digital CV gallery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {missingDefaultsCount > 0 && (
            <button
              type="button"
              onClick={async () => {
                const count = await syncDefaultPortfolioItems();
                if (count > 0) {
                  showNotice(`Added ${count} studio showcase work${count > 1 ? 's' : ''} to your gallery.`);
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2B3449] bg-[#1D2435] px-4 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:text-white whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              <span>Sync Showcase Works (+{missingDefaultsCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Work to Gallery</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
        >
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            {feedbackMessage}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            aria-label="Close notification"
            className="text-emerald-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Strip */}
      <section className="grid grid-cols-2 divide-y divide-[#2B3449] rounded-2xl border border-[#2B3449] bg-[#1D2435] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Published Works</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-semibold text-white">
            {portfolioItems.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Featured in Hero</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#F58220]">
            {featuredCount}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Active Disciplines</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-semibold text-white">
            {activeCategoriesCount}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-400">Total Gallery Views</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-semibold text-emerald-400">
            {totalViews.toLocaleString('en-US')}
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#2B3449] bg-[#1D2435] p-1">
          {(['All', ...PORTFOLIO_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#F58220] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search works or clients..."
            className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#1D2435] pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#2B3449] bg-[#1D2435] p-12 text-center space-y-3">
          <ImagePlus className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="font-display text-lg font-semibold text-white">No works match this filter</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try clearing your search filter or add a new project directly to this category.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-4 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span>Add Work Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#2B3449] bg-[#1D2435]"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#121722]">
                  <PortfolioImage
                    src={item.imageUrl}
                    alt={item.title}
                    category={item.category}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    aria-label={`Preview ${item.title}`}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3449] bg-[#161B26]/85 text-slate-200 hover:border-amber-500/60 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-amber-400 truncate">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{item.sourcePlatform}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{item.year}</span>
                    </div>
                    {item.featured && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Featured
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-lg font-semibold text-white line-clamp-1">
                    {item.title}
                  </h2>

                  <p className="text-xs font-medium text-slate-400 truncate">{item.client}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#2B3449] bg-[#161B26]/50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#2B3449] bg-[#161B26] px-2.5 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updatePortfolioItem(item.id, { featured: !item.featured })
                    }
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                      item.featured
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        : 'border-[#2B3449] bg-[#161B26] text-slate-300 hover:border-amber-500/60 hover:text-white'
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        item.featured ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                    <span>{item.featured ? 'Unfeature' : 'Feature'}</span>
                  </button>
                </div>

                {confirmDeleteId === item.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await deletePortfolioItem(item.id);
                        setConfirmDeleteId(null);
                        showNotice(`Removed "${item.title}" from the gallery.`);
                      }}
                      className="inline-flex h-8 items-center rounded-md bg-rose-500 px-2.5 text-xs font-semibold text-white hover:bg-rose-400"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="inline-flex h-8 items-center rounded-md border border-[#2B3449] bg-[#161B26] px-2 text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2B3449] bg-[#161B26] text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs no-print"
          role="dialog"
          aria-modal="true"
          aria-label={form.id ? 'Edit portfolio work' : 'Add work to gallery'}
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2B3449] bg-[#1D2435] shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2B3449] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {form.id ? 'Edit Portfolio Work' : 'Add Work to Gallery'}
                </h2>
                <p className="text-xs text-slate-400">
                  Changes sync immediately to your public Digital CV gallery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3449] text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
                  {formError}
                </div>
              )}

              {/* Quick Instagram @mulya_dzign Post Importer */}
              {!form.id && (
                <div className="rounded-xl border border-[#2B3449] bg-[#161B26] p-3.5 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Import from Instagram Post URL (@mulya_dzign)</span>
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="url"
                      value={igUrlInput}
                      onChange={(e) => setIgUrlInput(e.target.value)}
                      placeholder="https://www.instagram.com/p/..."
                      className="h-9 flex-1 rounded-lg border border-[#2B3449] bg-[#1D2435] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isImportingIg || !igUrlInput.trim()}
                      onClick={handleImportInstagramUrl}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-[#2B3449] bg-[#1D2435] px-3.5 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:text-white disabled:opacity-50 whitespace-nowrap"
                    >
                      {isImportingIg ? 'Checking...' : 'Fetch Post'}
                    </button>
                  </div>
                  {igImportNote && (
                    <p className="text-[11px] leading-relaxed text-slate-300">{igImportNote}</p>
                  )}
                </div>
              )}

              {/* Image Upload & Live Preview */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-5">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#2B3449] bg-[#121722]">
                    <PortfolioImage
                      src={form.imageUrl}
                      alt={form.title || 'Artwork preview'}
                      category={form.category}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />

                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/50 bg-[#161B26] px-4 text-xs font-medium text-amber-300 hover:border-amber-400 hover:bg-amber-500/5 disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    <span>
                      {isCompressing ? 'Optimizing artwork...' : 'Upload Artwork File (JPG / PNG / WebP)'}
                    </span>
                  </button>

                  {imageMeta && (
                    <p className="text-[11px] text-emerald-400 font-mono-tabular">
                      Optimized for gallery: {imageMeta}
                    </p>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Or paste an Image URL
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl.startsWith('data:image') ? '' : form.imageUrl}
                      onChange={(e) => {
                        setImageMeta(null);
                        setForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                      }}
                      placeholder={
                        form.imageUrl.startsWith('data:image')
                          ? 'Uploaded local image active — paste URL to replace'
                          : 'https://... or /assets/portfolio/...'
                      }
                      className="h-9 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Organic Coffee Pouch Packaging"
                    className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Client / Publisher *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.client}
                    onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
                    placeholder="e.g. Kopi Nusantara Roastery"
                    className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value as PortfolioCategory,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {PORTFOLIO_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Platform / Source
                  </label>
                  <select
                    value={form.sourcePlatform}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sourcePlatform: e.target.value as SocialPlatform,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {PLATFORMS.map((plat) => (
                      <option key={plat} value={plat}>
                        {plat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Year *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={16}
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                    placeholder="2025"
                    className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 font-mono-tabular text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Link (Behance / Instagram / Client URL)
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={form.externalUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
                  placeholder="https://www.behance.net/md_dzign"
                  className="h-10 w-full rounded-lg border border-[#2B3449] bg-[#161B26] px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Case Study Description *
                  </label>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {form.description.length}/1500
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={1500}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the design brief, print/KDP/packaging specs, typography, and visual impact..."
                  className="w-full rounded-lg border border-[#2B3449] bg-[#161B26] p-3 text-xs leading-relaxed text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-[#161B26] text-amber-500 focus:ring-amber-500"
                />
                <span>Feature prominently in the public gallery Bento showcase</span>
              </label>

              <div className="flex items-center justify-end gap-3 border-t border-[#2B3449] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-[#2B3449] bg-[#161B26] px-4 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F58220] px-5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : form.id ? 'Save Changes' : 'Publish to Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      <PortfolioLightbox
        items={filteredItems}
        activeItem={lightboxItem}
        onSelectItem={setLightboxItem}
        onClose={() => setLightboxItem(null)}
      />
    </div>
  );
};
