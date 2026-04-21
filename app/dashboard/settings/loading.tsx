export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="h-7 bg-gray-200 rounded w-40" />

      {/* Form card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-10 bg-gray-100 rounded-xl w-full" />
          </div>
        ))}
        <div className="pt-2">
          <div className="h-10 bg-gray-200 rounded-xl w-32" />
        </div>
      </div>
    </div>
  )
}
