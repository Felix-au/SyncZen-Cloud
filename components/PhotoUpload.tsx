'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onChange: (dataUri: string, filename: string) => void
  previewUrl?: string
  label?: string
  compact?: boolean
}

/**
 * Photo upload — clicks open the camera directly.
 * Falls back to the OS file picker automatically if:
 *   - No camera device is detected (enumerateDevices)
 *   - MediaDevices API is unavailable (old browser / HTTP)
 *
 * No manual choice required from the user.
 */
export function PhotoUpload({ onChange, previewUrl, label = 'Upload Photo', compact = false }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  /** Click handler: prefer camera, cascade to file picker on failure */
  async function handleClick() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasCamera = devices.some(d => d.kind === 'videoinput')
      if (hasCamera) {
        cameraRef.current?.click()
      } else {
        fileRef.current?.click()
      }
    } catch {
      // MediaDevices unsupported or permission denied before prompt — open file picker
      fileRef.current?.click()
    }
  }

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const dataUri = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 1024
        let { width, height } = img
        if (width > max || height > max) {
          if (width > height) { height = (height / width) * max; width = max }
          else { width = (width / height) * max; height = max }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        onChange(canvas.toDataURL('image/jpeg', 0.85), file.name.replace(/\.[^.]+$/, '.jpg'))
      }
      img.src = dataUri
    }
    reader.readAsDataURL(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>, isCameraInput: boolean) {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    } else if (isCameraInput) {
      // Camera input returned nothing (user cancelled camera or it failed) — open file picker
      fileRef.current?.click()
    }
    e.target.value = '' // reset so same file can be re-selected
  }

  const inputs = (
    <>
      {/* Camera-first input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={e => onInputChange(e, true)}
      />
      {/* Fallback file picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => onInputChange(e, false)}
      />
    </>
  )

  /* ── Compact circular avatar ────────────────────────────────── */
  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={handleClick}
          title="Tap to take a photo"
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
          {previewUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity var(--t-fast)', fontSize: 16, color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >✎</div>
          )}
        </button>
        {inputs}
      </div>
    )
  }

  /* ── Full drop-zone ─────────────────────────────────────────── */
  return (
    <div>
      {label && <div className="input-label" style={{ marginBottom: 8 }}>{label}</div>}
      <div
        className={`photo-drop ${dragging ? 'dragging' : ''}`}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) processFile(file)
        }}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8 }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-mute)', marginTop: 4 }}>Click to retake</span>
          </>
        ) : (
          <>
            <span className="photo-drop-icon">📷</span>
            <span className="photo-drop-text">
              Tap to take a photo
              <br /><small>Camera opens automatically · drag &amp; drop also works</small>
            </span>
          </>
        )}
      </div>
      {inputs}
    </div>
  )
}
