'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoVerificationProps {
  username: string
  duration: number
  onComplete: (imageData: string) => void
  onCancel: () => void
}

export function PhotoVerification({ username, duration, onComplete, onCancel }: PhotoVerificationProps) {
  const [stage, setStage] = useState<'camera' | 'preview' | 'submitting'>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch {
      console.error('Failed to access camera')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0)
    
    // Add username watermark
    const fontSize = Math.max(24, canvas.width * 0.04)
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.lineWidth = 2
    
    const text = `@${username}`
    const padding = 20
    ctx.strokeText(text, padding, canvas.height - padding)
    ctx.fillText(text, padding, canvas.height - padding)
    
    // Add duration watermark
    const durationText = `${(duration / 3600).toFixed(1)}h locked in`
    const durationWidth = ctx.measureText(durationText).width
    ctx.strokeText(durationText, canvas.width - durationWidth - padding, canvas.height - padding)
    ctx.fillText(durationText, canvas.width - durationWidth - padding, canvas.height - padding)

    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    setStage('preview')
    stopCamera()
  }, [username, duration, stopCamera])

  const retake = useCallback(() => {
    setCapturedImage(null)
    setStage('camera')
    startCamera()
  }, [startCamera])

  const submit = useCallback(() => {
    if (capturedImage) {
      setStage('submitting')
      // Simulate upload delay
      setTimeout(() => {
        onComplete(capturedImage)
      }, 1500)
    }
  }, [capturedImage, onComplete])

  // Start camera when component mounts
  useState(() => {
    startCamera()
  })

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={() => {
            stopCamera()
            onCancel()
          }}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium uppercase tracking-wider">verify your work</span>
        <div className="w-9" />
      </div>

      {/* Camera / Preview Area */}
      <div className="flex-1 relative bg-black">
        {stage === 'camera' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            {/* Username overlay preview */}
            <div className="absolute bottom-20 left-4 text-white/80 text-lg font-bold">
              @{username}
            </div>
            <div className="absolute bottom-20 right-4 text-white/80 text-lg font-bold">
              {(duration / 3600).toFixed(1)}h
            </div>
          </>
        )}

        {stage === 'preview' && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured work"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {stage === 'submitting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-lockin-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Uploading proof...</p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border">
        {stage === 'camera' && (
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-foreground flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Camera className="w-8 h-8" />
            </button>
          </div>
        )}

        {stage === 'preview' && (
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={retake}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
              <span className="text-xs uppercase tracking-wider">Retake</span>
            </button>
            <button
              onClick={submit}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-lockin-red text-foreground hover:bg-lockin-red-glow transition-colors"
            >
              <Check className="w-6 h-6" />
              <span className="text-xs uppercase tracking-wider">Submit</span>
            </button>
          </div>
        )}

        {stage === 'submitting' && (
          <div className="text-center text-sm text-muted-foreground">
            Adding to your streak...
          </div>
        )}
      </div>
    </div>
  )
}
