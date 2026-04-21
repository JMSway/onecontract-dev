export default function TeamLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div className="h-7 bg-gray-200 rounded w-40" />
        <div className="h-10 bg-gray-200 rounded-xl w-44" />
      </div>

      {/* Members list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-8 bg-gray-100 rounded-xl w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
