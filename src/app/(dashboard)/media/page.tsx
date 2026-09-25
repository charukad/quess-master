import Image from 'next/image'
import { getMediaAssets } from '@/actions/media'
import MediaUploader from '@/components/media/MediaUploader'
import { EmptyState, PageIntro } from '@/components/ui/quizza'

export default async function MediaLibraryPage() {
  const assets = await getMediaAssets()
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageIntro eyebrow="Your creative kit" title="Media library" description="Keep images, audio, and video ready to bring every question to life." action={<MediaUploader />} />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {assets.map((asset) => (
          <article key={asset.id} className="quizza-panel group overflow-hidden p-1">
            <div className="relative h-40 w-full bg-muted">
              {asset.resourceType === 'image' && <Image src={asset.secureUrl} alt={asset.publicId} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" className="object-cover" />}
              {asset.resourceType === 'video' && <video src={asset.secureUrl} controls className="h-40 w-full object-cover" />}
              {asset.resourceType === 'audio' && <div className="flex h-full items-center p-4"><audio src={asset.secureUrl} controls className="w-full" /></div>}
            </div>
            <div className="p-4 pt-3">
              <p className="truncate text-sm font-medium" title={asset.publicId}>{asset.publicId.split('/').pop()}</p>
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-1 capitalize">{asset.resourceType}</span>
                <span>{Math.round(asset.bytes / 1024)} KB</span>
              </div>
            </div>
          </article>
        ))}
        {assets.length === 0 && <div className="col-span-full"><EmptyState title="No media yet" description="Upload an image, audio clip, or video to reuse in your quiz questions." /></div>}
      </div>
    </div>
  )
}
