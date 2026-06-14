'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  /** Called with base64 data URI after the user selects/drops/captures a file */
  onChange: (dataUri: string, filename: string) => void
  /** Preview URL to display (uploaded file from Drive or local preview) */
  previewUrl?: string
  label?: string
  /** Show as compact avatar-picker (52x52) instead of full drop zone */
  compact?: boolean
}

/**
 * Reusable photo upload component.
 *
 * Three ways to add a photo:
 *   1. Click the drop zone / avatar → file picker (all devices)
 *   2. Drag & drop onto the drop zone (desktop)
 *   3. "Use Camera" button → opens rear camera directly on mobile
 *      (uses capture="environment"; on desktop this opens the file picker)
 *
 * Converts the chosen image to base64, resizes to max 1024px via canvas.
 */
export function PhotoUpload({ onChange, previewUrl, label = 'Upload Photo', compact = false }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas  = document.createElement('canvas')
        const maxDim  = 1024
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        onChange(resized, file.name.replace(/\.[^.]+$/, '.jpg'))
      }
      img.src = dataUri
    }
    reader.readAsDataURL(file)
  }

  /* ── Compact mode (avatar picker) ──────────────────────────────────── */
  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* Main click target */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            position: 'relative',
            width: 52, height: 52,
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
        >
          {previewUrl
            ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 22, opacity: 0.4, lineHeight: '52px' }}>📷</span>
          }
        </button>

        {/* Camera shortcut — always shown; capture attr opens camera on mobile,
            falls back to file picker on desktop browsers that ignore capture */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          style={{
            fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
            textDecoration: 'underline', textDecorationStyle: 'dotted',
          }}
        >
          📸 Camera
        </button>

        {/* Hidden inputs */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => {
            if (e.target.files?.[0]) handleFile(e.target.files[0])
            // Reset so the same file can be re-captured
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  /* ── Full drop-zone mode ────────────────────────────────────────────── */
  return (
    <div>
      {label && <div className="input-label" style={{ marginBottom: 8 }}>{label}</div>}

      <div
        className={`photo-drop ${dragging ? 'dragging' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <>
            <span className="photo-drop-icon">📸</span>
            <span className="photo-drop-text">
              Click or drag &amp; drop a photo here
              <br /><small>JPEG, PNG, WEBP • max 10MB</small>
            </span>
          </>
        )}
      </div>

      {/* Camera button — always rendered; on mobile opens rear camera directly */}
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 8, gap: 6 }}
      >
        📷 Use Camera
      </button>

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={e => {
          if (e.target.files?.[0]) handleFile(e.target.files[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
