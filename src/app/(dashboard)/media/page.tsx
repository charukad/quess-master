import Image from 'next/image'
import { getMediaAssets } from '@/actions/media'
import MediaUploader from '@/components/media/MediaUploader'

export default async function MediaLibraryPage() {
  const assets = await getMediaAssets()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <MediaUploader />
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {assets.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-xl border bg-card shadow">
            <div className="relative h-40 w-full bg-muted">
              {asset.resourceType === 'image' && <Image src={asset.secureUrl} alt={asset.publicId} fill unoptimized className="object-cover" />}
              {asset.resourceType === 'video' && <video src={asset.secureUrl} controls className="h-40 w-full object-cover" />}
              {asset.resourceType === 'audio' && <div className="flex h-full items-center p-4"><audio src={asset.secureUrl} controls className="w-full" /></div>}
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-medium" title={asset.publicId}>{asset.publicId.split('/').pop()}</p>
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-1 capitalize">{asset.resourceType}</span>
                <span>{Math.round(asset.bytes / 1024)} KB</span>
              </div>
            </div>
          </article>
        ))}
        {assets.length === 0 && <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">No media assets found.</div>}
      </div>
    </div>
  )
}
