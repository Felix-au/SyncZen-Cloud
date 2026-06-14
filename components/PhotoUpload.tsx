'use client'

import { useState, useRef, useEffect } from 'react'

interface PhotoUploadProps {
  onChange: (dataUri: string, filename: string) => void
  previewUrl?: string
  label?: string
  /** Compact circular avatar-picker vs full drop-zone */
  compact?: boolean
}

/**
 * Photo upload component with a camera-or-file-picker choice popover.
 *
 * Clicking the avatar / drop-zone shows a small floating menu:
 *   📷 Take Photo  — opens the device camera (rear on mobile, webcam on desktop)
 *   🖼 Choose File  — opens the OS file picker
 *
 * No separate camera button; the popover dismisses on outside click or Escape.
 */
export function PhotoUpload({ onChange, previewUrl, label = 'Upload Photo', compact = false }: PhotoUploadProps) {
  const [open, setOpen]       = useState(false)
  const [dragging, setDragging] = useState(false)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleFile(file: File) {
    setOpen(false)
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

  function pickFile()   { fileRef.current?.click();   setOpen(false) }
  function pickCamera() { cameraRef.current?.click(); setOpen(false) }

  /* ── Shared hidden inputs ───────────────────────────────────────────── */
  const hiddenInputs = (
    <>
      <input ref={fileRef}   type="file" accept="image/*"                      hidden onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }} />
    </>
  )

  /* ── Shared popover menu ────────────────────────────────────────────── */
  const popover = open && (
    <div style={{
      position: 'absolute',
      top: compact ? 58 : 'auto',
      bottom: compact ? 'auto' : 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: 'var(--surface)',
      border: '1px solid var(--border-hi)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-lg)',
      padding: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 160,
      animation: 'fadeIn 120ms ease',
    }}>
      <button
        type="button"
        onClick={pickCamera}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-sm)', fontWeight: 600,
          color: 'var(--text-pri)', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', width: '100%',
          transition: 'background var(--t-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ fontSize: 16 }}>📷</span> Take Photo
      </button>
      <button
        type="button"
        onClick={pickFile}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-sm)', fontWeight: 600,
          color: 'var(--text-pri)', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', width: '100%',
          transition: 'background var(--t-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--elevated)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ fontSize: 16 }}>🖼️</span> Choose File
      </button>
    </div>
  )

  /* ── Compact mode (circular avatar) ────────────────────────────────── */
  if (compact) {
    return (
      <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'relative',
            width: 52, height: 52,
            borderRadius: '50%',
            border: `2px ${open ? 'solid' : 'dashed'} ${open ? 'var(--accent)' : 'var(--border-hi)'}`,
            background: previewUrl ? 'none' : 'var(--elevated)',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'border-color var(--t-base)',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--border-hi)' }}
          title="Click to add photo"
        >
          {previewUrl
            ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 22, opacity: 0.4, lineHeight: '52px' }}>📷</span>
          }
          {/* Edit overlay when preview exists */}
          {previewUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity var(--t-fast)',
              fontSize: 16, color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >✎</div>
          )}
        </button>
        {popover}
        {hiddenInputs}
      </div>
    )
  }

  /* ── Full drop-zone mode ─────────────────────────────────────────────── */
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && <div className="input-label" style={{ marginBottom: 8 }}>{label}</div>}
      <div
        className={`photo-drop ${dragging ? 'dragging' : ''}`}
        style={{ cursor: 'pointer', position: 'relative' }}
        onClick={() => setOpen(o => !o)}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8 }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 4 }}>
              Click to change
            </span>
          </>
        ) : (
          <>
            <span className="photo-drop-icon">📸</span>
            <span className="photo-drop-text">
              Click to add photo or drag &amp; drop
              <br /><small>JPEG, PNG, WEBP • max 10MB</small>
            </span>
          </>
        )}
      </div>
      {popover}
      {hiddenInputs}
    </div>
  )
}
