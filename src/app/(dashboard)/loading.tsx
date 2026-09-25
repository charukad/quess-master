export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8" aria-label="Loading page">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded-full bg-primary/10" />
        <div className="h-9 w-72 max-w-full rounded-xl bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="h-44 rounded-[2rem] bg-[#34123f]/10" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-64 rounded-3xl bg-white shadow-sm" />)}
      </div>
    </div>
  )
}
