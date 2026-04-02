'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Package, LogIn, LogOut, ClipboardCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ScannedItem {
  id: string
  name: string
  asset_tag: string | null
  status: string
  category: string | null
  holder: string | null
  loanId: string | null
}

export function ScanClient({ role }: { role: string }) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scanning, setScanning] = useState(false)
  const [item, setItem] = useState<ScannedItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const canManage = role === 'admin' || role === 'equipment_manager'

  const handleScan = useCallback(async (decodedText: string) => {
    // Extract item ID from URL
    const match = decodedText.match(/\/inventory\/([a-f0-9-]+)/)
    if (!match) {
      setError('Not a valid equipment QR code')
      return
    }

    const itemId = match[1]
    setLoading(true)
    setError(null)

    // Stop the scanner
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)

    // Fetch item details
    try {
      const res = await fetch(`/api/item/${itemId}`)
      if (!res.ok) {
        setError('Item not found')
        setLoading(false)
        return
      }
      const data = await res.json()
      setItem(data)
    } catch {
      setError('Failed to look up item')
    }
    setLoading(false)
  }, [])

  async function startScanner() {
    setItem(null)
    setError(null)

    if (!containerRef.current) return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      )
      setScanning(true)
    } catch {
      setError('Could not access camera. Check permissions.')
    }
  }

  async function stopScanner() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scan Equipment</h1>
        <p className="text-sm text-gray-500">Scan a QR label to take action</p>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div id="qr-reader" ref={containerRef} className={scanning ? '' : 'hidden'} />
        {!scanning && !item && (
          <button
            onClick={startScanner}
            className="w-full flex flex-col items-center gap-3 py-12 text-gray-400 hover:text-gold-600 transition-colors"
          >
            <Camera size={48} strokeWidth={1} />
            <span className="text-sm font-medium">Tap to scan</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-500 py-4">Looking up item...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
          <button onClick={startScanner} className="block mt-2 text-xs font-medium text-red-600 underline">
            Scan again
          </button>
        </div>
      )}

      {/* Scanned item actions */}
      {item && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
            </div>
            {item.asset_tag && (
              <div className="text-xs text-gray-500 ml-6 font-mono">{item.asset_tag}</div>
            )}
            {item.category && (
              <div className="text-xs text-gray-400 ml-6">{item.category}</div>
            )}
            <div className="mt-2 ml-6">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.status === 'available' ? 'bg-green-100 text-green-700' :
                item.status === 'on_loan' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {item.status === 'on_loan' ? `On loan to ${item.holder}` : item.status}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            {item.status === 'on_loan' && item.loanId && canManage && (
              <Link
                href={`/checkin?loan=${item.loanId}`}
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors"
              >
                <LogIn size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-800 flex-1">Check In</span>
                <ArrowRight size={14} className="text-green-400" />
              </Link>
            )}

            {item.status === 'available' && canManage && (
              <Link
                href={`/checkout?item=${item.id}`}
                className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors"
              >
                <LogOut size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800 flex-1">Check Out</span>
                <ArrowRight size={14} className="text-blue-400" />
              </Link>
            )}

            {!['retired', 'lost', 'damaged'].includes(item.status) && (
              <Link
                href={`/inventory/${item.id}#condition`}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 hover:bg-amber-100 transition-colors"
              >
                <ClipboardCheck size={18} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800 flex-1">Log Condition</span>
                <ArrowRight size={14} className="text-amber-400" />
              </Link>
            )}

            <Link
              href={`/inventory/${item.id}`}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <Package size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 flex-1">View Details</span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
          </div>

          <button
            onClick={startScanner}
            className="w-full text-sm font-medium text-gold-600 hover:text-gold-800 py-2"
          >
            Scan another
          </button>
        </div>
      )}
    </div>
  )
}
