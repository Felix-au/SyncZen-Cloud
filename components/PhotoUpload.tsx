'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onChange: (dataUri: string, filename: string) => void
  previewUrl?: string
  label?: string
  /** Compact circular avatar-picker vs full drop-zone */
  compact?: boolean
}

/**
 * Photo upload component.
 *
 * Clicking opens the device camera on mobile (capture="environment").
 * On desktop the browser falls back to the system file picker.
 * Drag & drop works on the full drop-zone variant.
 */
export function PhotoUpload({ onChange, previewUrl, label = 'Upload Photo', compact = false }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 1024
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        onChange(canvas.toDataURL('image/jpeg', 0.85), file.name.replace(/\.[^.]+$/, '.jpg'))
      }
      img.src = dataUri
    }
    reader.readAsDataURL(file)
  }

  const trigger = () => { inputRef.current?.click() }

  /* Single hidden input — capture="environment" = camera on mobile, file picker on desktop */
  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      onChange={e => {
        if (e.target.files?.[0]) handleFile(e.target.files[0])
        e.target.value = ''
      }}
    />
  )

  /* ── Compact circular avatar ─────────────────────────────────── */
  if (compact) {
    return (
      <button
        type="button"
        onClick={trigger}
        style={{
          position: 'relative',
          width: 72, height: 72,
          borderRadius: '50%',
          border: '2px dashed var(--border-hi)',
          background: previewUrl ? 'none' : 'var(--elevated)',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'border-color var(--t-base)',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hi)')}
        title="Take photo or choose file"
      >
        {previewUrl
          ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 30, opacity: 0.4, lineHeight: '72px' }}>📷</span>
        }
        {/* Subtle edit overlay when a photo is already set */}
        {previewUrl && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff', opacity: 0,
            transition: 'opacity var(--t-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >✎</span>
        )}
        {hiddenInput}
      </button>
    )
  }

  /* ── Full drop-zone ──────────────────────────────────────────── */
  return (
    <div>
      {label && <div className="input-label" style={{ marginBottom: 8 }}>{label}</div>}
      <div
        className={`photo-drop ${dragging ? 'dragging' : ''}`}
        onClick={trigger}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
        }}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8 }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 4 }}>Click to change</span>
          </>
        ) : (
          <>
            <span className="photo-drop-icon">📷</span>
            <span className="photo-drop-text">
              Tap to take photo or drag &amp; drop
              <br /><small>JPEG, PNG, WEBP • max 10MB</small>
            </span>
          </>
        )}
      </div>
      {hiddenInput}
    </div>
  )
}
