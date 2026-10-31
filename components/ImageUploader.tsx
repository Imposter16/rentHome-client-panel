'use client';

import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, Star, AlertCircle, CheckCircle2, Image as ImageIcon, Plus } from 'lucide-react';

export interface ImageItem {
  id: string;
  file?: File;
  url: string;
  isExisting?: boolean;
}

export interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  min?: number;
  max?: number;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  themeColor?: 'indigo' | 'teal';
}

/**
 * Utility helper to convert server image URLs into ImageItem objects
 */
export function parseImageUrlsToItems(imageUrl?: string | string[] | null): ImageItem[] {
  if (!imageUrl) return [];
  const urls: string[] = Array.isArray(imageUrl)
    ? imageUrl
    : imageUrl.split(',').map((s) => s.trim()).filter(Boolean);

  return urls.map((url, idx) => ({
    id: `existing-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url,
    isExisting: true
  }));
}

export default function ImageUploader({
  images,
  onChange,
  min = 3,
  max = 10,
  label = 'Property Photos',
  helperText,
  disabled = false,
  themeColor = 'indigo'
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Keep track of blob URLs created locally so they can be cleaned up
  const createdUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      // Cleanup all created blob URLs on unmount
      createdUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      createdUrlsRef.current.clear();
    };
  }, []);

  const handleFiles = (files: FileList | File[]) => {
    setLocalError(null);
    const validImageFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        validImageFiles.push(file);
      }
    });

    if (validImageFiles.length === 0) {
      setLocalError('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    const currentCount = images.length;
    if (currentCount >= max) {
      setLocalError(`Maximum ${max} photos allowed. Please remove a photo before adding more.`);
      return;
    }

    const availableSlots = max - currentCount;
    let filesToAdd = validImageFiles;

    if (validImageFiles.length > availableSlots) {
      setLocalError(`Maximum ${max} photos allowed. Only ${availableSlots} photo(s) could be added.`);
      filesToAdd = validImageFiles.slice(0, availableSlots);
    }

    const newItems: ImageItem[] = filesToAdd.map((file) => {
      const url = URL.createObjectURL(file);
      createdUrlsRef.current.add(url);
      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        url,
        isExisting: false
      };
    });

    onChange([...images, ...newItems]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value so same files can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || images.length >= max) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || images.length >= max) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (idToRemove: string) => {
    setLocalError(null);
    const itemToRemove = images.find((img) => img.id === idToRemove);
    if (itemToRemove && itemToRemove.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(itemToRemove.url);
        createdUrlsRef.current.delete(itemToRemove.url);
      } catch {
        // ignore
      }
    }
    onChange(images.filter((img) => img.id !== idToRemove));
  };

  const handleSetCover = (idToCover: string) => {
    const selected = images.find((img) => img.id === idToCover);
    if (!selected) return;
    const rest = images.filter((img) => img.id !== idToCover);
    onChange([selected, ...rest]);
  };

  const isMinViolated = images.length < min;
  const isMaxViolated = images.length > max;
  const isCountValid = !isMinViolated && !isMaxViolated;

  const activeTheme = themeColor === 'teal' ? {
    border: 'border-teal-500',
    bg: 'bg-teal-50/50',
    text: 'text-teal-700',
    badge: 'bg-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700'
  } : {
    border: 'border-indigo-500',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-700',
    badge: 'bg-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700'
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Header with Title and Photo Counter */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label} <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {helperText || `Upload between ${min} and ${max} high-quality images. First photo serves as the listing cover.`}
          </p>
        </div>

        {/* Live Count Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all ${
              isCountValid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isCountValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              {images.length} / {max} Photos
            </span>
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && images.length < max && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer select-none ${
          disabled || images.length >= max
            ? 'border-slate-200 bg-slate-50/80 cursor-not-allowed opacity-75'
            : isDragging
            ? `${activeTheme.border} ${activeTheme.bg} scale-[1.005] shadow-md`
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || images.length >= max}
          onChange={handleFileInputChange}
          className="hidden"
          id="image-file-input"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-500'
          }`}>
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {images.length >= max ? (
                <span className="text-slate-500">Maximum photo capacity reached ({max}/{max})</span>
              ) : (
                <>
                  <span className={`${activeTheme.text} font-bold hover:underline`}>
                    Click to browse
                  </span>{' '}
                  or drag & drop listing photos here
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports JPEG, PNG, WEBP • Max 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Validation Feedback Messages */}
      {localError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{localError}</span>
        </div>
      )}

      {isMinViolated && images.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Minimum {min} photos required for approval (currently {images.length}/{min}). Please add at least {min - images.length} more photo(s).
          </span>
        </div>
      )}

      {/* Thumbnail Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
            <span>Listing Gallery Preview</span>
            <span className="text-[11px] font-normal text-slate-500">Click &quot;Cover&quot; on any photo to set as primary</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((item, index) => {
              const isCover = index === 0;

              return (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition-all shadow-xs ${
                    isCover
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Image Element */}
                  <img
                    src={item.url}
                    alt={`Property photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top Overlay Bar */}
                  <div className="absolute top-0 inset-x-0 p-1.5 flex items-start justify-between bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10">
                    {/* Cover badge or status */}
                    <div>
                      {isCover ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm pointer-events-auto">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          #1 Cover
                        </span>
                      ) : item.isExisting ? (
                        <span className="inline-flex items-center bg-slate-800/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-auto">
                          Existing
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-emerald-700/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-auto">
                          New File
                        </span>
                      )}
                    </div>

                    {/* Delete Cross Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      title="Remove this photo"
                      className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 text-white flex items-center justify-center shadow-md transition-all cursor-pointer pointer-events-auto border border-white/60"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Bottom Action: Set as Cover Button (if not already cover) */}
                  {!isCover && (
                    <div className="absolute bottom-1.5 inset-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCover(item.id);
                        }}
                        className="w-full py-1 bg-slate-900/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Star className="w-2.5 h-2.5" />
                        Set as Cover
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Add More Tile if under limit */}
            {images.length < max && !disabled && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 group-hover:border-indigo-400 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 mb-1 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700">
                  Add Photo
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  ({max - images.length} left)
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
