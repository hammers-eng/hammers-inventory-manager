'use client'

import { removeTemplateLine } from '@/actions/templates'
import { useTransition } from 'react'
import { X } from 'lucide-react'

interface Props {
  line: { id: string; quantity: number; notes: string | null }
  catName: string
  available: number
  enough: boolean
  templateId: string
}

export function TemplateLineManager({ line, catName, available, enough, templateId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      await removeTemplateLine(line.id, templateId)
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{line.quantity}×</span>
        <span className="text-sm text-gray-700">{catName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${enough ? 'text-green-600' : 'text-red-600'}`}>
          {available} available
        </span>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
