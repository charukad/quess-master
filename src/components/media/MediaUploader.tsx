'use client'

import { useRef, useState } from 'react'
import { getUploadSignature, saveMediaAsset } from '@/actions/media'

interface CloudinaryUploadResponse {
  public_id?: string
  secure_url?: string
  resource_type?: string
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
  error?: { message?: string }
}

const MAX_FILE_SIZE = 100 * 1024 * 1024

export default function MediaUploader() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!/^(image|audio|video)\//.test(file.type)) {
      setError('Choose an image, audio, or video file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Files must be 100 MB or smaller.')
      return
    }

    try {
      setUploading(true)
      setError('')
      const { timestamp, signature, folder, apiKey } = await getUploadSignature()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp.toString())
      formData.append('signature', signature)
      formData.append('folder', folder)
      const resourceType = file.type.startsWith('audio/') ? 'video' : 'auto'
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: 'POST', body: formData })
      const data = await response.json() as CloudinaryUploadResponse
      if (!response.ok || data.error || !data.public_id || !data.secure_url || !data.resource_type) {
        throw new Error(data.error?.message ?? 'Cloudinary upload failed')
      }
      await saveMediaAsset({
        publicId: data.public_id,
        secureUrl: data.secure_url,
        resourceType: file.type.startsWith('audio/') ? 'audio' : data.resource_type,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
        duration: data.duration,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,audio/*,video/*" />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {uploading ? 'Uploading…' : 'Upload Media'}
      </button>
      {error && <p role="alert" className="max-w-64 text-sm text-destructive">{error}</p>}
    </div>
  )
}
