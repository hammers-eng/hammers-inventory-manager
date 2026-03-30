'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  itemId: string
  itemName: string
  assetTag?: string | null
}

export function QrLabel({ itemId, itemName, assetTag }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/inventory/${itemId}`
    : ''

  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 128,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
    }).then(() => setReady(true))
  }, [url])

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>QR Label — ${itemName}</title>
  <style>
    @page { size: 62mm 30mm; margin: 0; }
    body { margin: 0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .label { display: flex; align-items: center; gap: 10px; padding: 6px; }
    .label img { width: 80px; height: 80px; }
    .info { font-size: 11px; line-height: 1.3; }
    .name { font-weight: 700; font-size: 12px; }
    .tag { color: #666; font-family: monospace; }
    .club { font-size: 9px; color: #999; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="label">
    <img src="${dataUrl}" />
    <div class="info">
      <div class="name">${itemName}</div>
      ${assetTag ? `<div class="tag">${assetTag}</div>` : ''}
      <div class="club">Hammers RUFC</div>
    </div>
  </div>
  <script>window.onload=()=>{window.print();window.close()}<\/script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <div className="flex items-center gap-4">
      <canvas ref={canvasRef} className="rounded border" />
      {ready && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            Scan to view this item
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer size={14} />
            Print label
          </Button>
        </div>
      )}
    </div>
  )
}
