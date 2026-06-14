'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  imageSrc: string
  aspectRatio?: number // e.g. 1 for square, undefined for free crop
  onCrop: (croppedDataUri: string) => void
  onCancel: () => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ imageSrc, aspectRatio, onCrop, onCancel }: ImageCropperProps) {
  const [mounted, setMounted] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const { width, height } = img

    if (aspectRatio) {
      const initial = centerAspectCrop(width, height, aspectRatio)
      setCrop(initial)
      
      const pixelWidth = (initial.width / 100) * img.naturalWidth
      const pixelHeight = (initial.height / 100) * img.naturalHeight
      const pixelX = (initial.x / 100) * img.naturalWidth
      const pixelY = (initial.y / 100) * img.naturalHeight
      setCompletedCrop({
        unit: 'px',
        x: pixelX,
        y: pixelY,
        width: pixelWidth,
        height: pixelHeight
      })
    } else {
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      setCompletedCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
  }

  const handleSave = () => {
    const img = imageRef.current
    if (!img || !completedCrop) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      alert('Failed to process cropped canvas image context.')
      return
    }

    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    const sourceX = completedCrop.x * scaleX
    const sourceY = completedCrop.y * scaleY
    const sourceW = completedCrop.width * scaleX
    const sourceH = completedCrop.height * scaleY

    if (sourceW <= 0 || sourceH <= 0) {
      alert('Invalid crop dimensions.')
      return
    }

    const maxCropDim = 1200
    let destW = sourceW
    let destH = sourceH
    if (sourceW > maxCropDim || sourceH > maxCropDim) {
      if (sourceW > sourceH) {
        destH = (sourceH / sourceW) * maxCropDim
        destW = maxCropDim
      } else {
        destW = (sourceW / sourceH) * maxCropDim
        destH = maxCropDim
      }
    }

    canvas.width = destW
    canvas.height = destH

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      destW,
      destH
    )

    const croppedDataUri = canvas.toDataURL('image/jpeg', 0.85)
    onCrop(croppedDataUri)
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <style>{`
        .ReactCrop__crop-selection {
          border: 2px dashed var(--accent, #3b82f6) !important;
        }
        .ReactCrop__drag-handle::after {
          background-color: var(--accent, #3b82f6) !important;
          border: 2px solid #ffffff !important;
          border-radius: 50% !important;
          width: 12px !important;
          height: 12px !important;
        }
      `}</style>
      <div
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'var(--surface)',
          border: '1px solid var(--border-hi)',
          borderRadius: 'var(--r-lg, 16px)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-pri)' }}>
            Crop Photo
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-sec)',
              background: 'var(--bg-alt)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            {aspectRatio ? 'Square (1:1)' : 'Free Crop'}
          </span>
        </div>

        {/* Workspace */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-alt)',
            overflow: 'auto',
            flex: 1,
            minHeight: '280px',
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            style={{ maxWidth: '100%', maxHeight: '55vh' }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source"
              onLoad={handleImageLoad}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '55vh',
              }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!completedCrop || completedCrop.width === 0}
            style={{ minWidth: '120px' }}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
