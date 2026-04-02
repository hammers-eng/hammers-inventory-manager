'use client'

import { deleteTemplate } from '@/actions/templates'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function TemplateActions({ templateId, templateName }: { templateId: string; templateName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete template "${templateName}"?`)) return
    startTransition(async () => {
      await deleteTemplate(templateId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); handleDelete() }}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
