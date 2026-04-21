export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-7 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded-xl w-32" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
