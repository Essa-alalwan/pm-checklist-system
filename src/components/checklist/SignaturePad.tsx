import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
  value: string
  onChange: (dataUrl: string) => void
  label?: string
}

export function SignaturePad({ value, onChange, label = 'Technician signature' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)
  const [empty, setEmpty] = useState(!value)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    ctx.scale(ratio, ratio)
    ctx.fillStyle = '#f7f5ef'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#1c2530'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = value
    }
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawing.current = true
    canvas.setPointerCapture(e.pointerId)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    hasStrokes.current = true
    setEmpty(false)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas && hasStrokes.current) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#f7f5ef'
    ctx.fillRect(0, 0, rect.width, rect.height)
    hasStrokes.current = false
    setEmpty(true)
    onChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <button
          type="button"
          onClick={clear}
          disabled={empty}
          className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-text-muted hover:text-critical disabled:opacity-30"
        >
          <Eraser className="size-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>
      <div className="relative mt-1.5 overflow-hidden rounded-lg border border-border-strong bg-[#f7f5ef]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={empty ? `${label}: not yet signed` : `${label}: signed`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-40 w-full touch-none"
        />
        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#8a8578]">
            Sign here
          </p>
        )}
      </div>
    </div>
  )
}
