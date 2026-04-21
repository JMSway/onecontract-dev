export default function TemplatesLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div className="h-7 bg-gray-200 rounded w-40" />
        <div className="h-10 bg-gray-200 rounded-xl w-44" />
      </div>

      {/* Template cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-5 bg-gray-200 rounded w-36" />
              <div className="h-6 bg-gray-100 rounded-full w-12" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="pt-2 flex gap-2">
              <div className="h-8 bg-gray-100 rounded-xl flex-1" />
              <div className="h-8 bg-gray-100 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
