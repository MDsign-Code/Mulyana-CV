import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import type { PortfolioItemData } from '../types';
import { PortfolioImage } from './PortfolioImage';

interface PortfolioLightboxProps {
  items: PortfolioItemData[];
  activeItem: PortfolioItemData | null;
  onSelectItem: (item: PortfolioItemData) => void;
  onClose: () => void;
}

export const PortfolioLightbox: React.FC<PortfolioLightboxProps> = ({
  items,
  activeItem,
  onSelectItem,
  onClose,
}) => {
  const activeIndex = activeItem ? items.findIndex((i) => i.id === activeItem.id) : -1;

  const goPrev = React.useCallback(() => {
    if (items.length <= 1 || activeIndex < 0) return;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    onSelectItem(items[prevIdx]);
  }, [items, activeIndex, onSelectItem]);

  const goNext = React.useCallback(() => {
    if (items.length <= 1 || activeIndex < 0) return;
    const nextIdx = (activeIndex + 1) % items.length;
    onSelectItem(items[nextIdx]);
  }, [items, activeIndex, onSelectItem]);

  useEffect(() => {
    if (!activeItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeItem, onClose, goPrev, goNext]);

  if (!activeItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-label={activeItem.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#2B3449] bg-[#1D2435] shadow-2xl max-h-[92vh]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project preview"
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2B3449] bg-[#161B26]/90 text-white hover:border-amber-500/60 hover:bg-[#161B26]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Media Viewport */}
          <div className="relative flex min-h-[280px] items-center justify-center bg-[#121722] md:col-span-7 md:min-h-[440px]">
            <PortfolioImage
              src={activeItem.imageUrl}
              alt={activeItem.title}
              category={activeItem.category}
              className="max-h-[62vh] w-full object-contain"
            />

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous project"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2B3449] bg-[#161B26]/85 text-white hover:border-amber-500/60 hover:bg-[#161B26]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next project"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2B3449] bg-[#161B26]/85 text-white hover:border-amber-500/60 hover:bg-[#161B26]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {activeIndex >= 0 && (
              <div className="absolute bottom-3 left-3 rounded-md border border-[#2B3449] bg-[#161B26]/90 px-2.5 py-1 font-mono-tabular text-xs font-medium text-slate-200">
                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                {String(items.length).padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="flex flex-col justify-between p-6 md:col-span-5">
            <div className="space-y-4 pr-8 md:pr-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-amber-400">{activeItem.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeItem.sourcePlatform}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{activeItem.year}</span>
              </div>

              <h3 className="font-display text-2xl font-semibold text-white">
                {activeItem.title}
              </h3>

              <p className="text-xs font-medium text-slate-400">
                Client: <span className="text-slate-200">{activeItem.client}</span>
              </p>

              <p className="text-sm leading-relaxed text-slate-300">
                {activeItem.description}
              </p>
            </div>

            <div className="mt-8 space-y-3 border-t border-[#2B3449] pt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                <span>{activeItem.views.toLocaleString('en-US')} views</span>
                <span>{activeItem.likes.toLocaleString('en-US')} likes</span>
              </div>
              {activeItem.externalUrl && (
                <a
                  href={activeItem.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#F58220] px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  <span>Open Project on {activeItem.sourcePlatform}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Filmstrip */}
        {items.length > 1 && (
          <div className="border-t border-[#2B3449] bg-[#161B26] px-4 py-3">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
              {items.map((item) => {
                const isSelected = item.id === activeItem.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    aria-label={`Preview ${item.title}`}
                    className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#F58220] ring-2 ring-[#F58220]/40'
                        : 'border-[#2B3449] opacity-65 hover:opacity-100'
                    }`}
                  >
                    <PortfolioImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
