import { QuizzaLogo } from '@/components/QuizzaLogo'

export default function SessionLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl animate-pulse p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between border-b pb-5"><QuizzaLogo compact /><div className="h-9 w-32 rounded-full bg-muted" /></div>
      <div className="grid gap-8 md:grid-cols-[1fr_350px]">
        <div className="space-y-6"><div className="h-36 rounded-3xl bg-primary/10" /><div className="h-[520px] rounded-3xl bg-white" /></div>
        <div className="h-80 rounded-3xl bg-white" />
      </div>
    </main>
  )
}
