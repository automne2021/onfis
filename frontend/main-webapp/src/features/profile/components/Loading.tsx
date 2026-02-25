export function Loading() {
  return (
    <div className="min-h-screen bg-neutral-100 pt-6 pb-12 px-4 md:px-8 xl:px-32 2xl:px-48">
      
      {/* Skeleton cho Tiêu đề trang (Profile Overview) */}
      <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse mb-4"></div>

      {/* ================= HEADER CARD SKELETON ================= */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
        <div className="p-6 pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar Skeleton */}
            <div className="w-20 h-20 rounded-full bg-neutral-200 animate-pulse shrink-0"></div>
            
            {/* Thông tin Name & Meta Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="w-48 h-8 bg-neutral-200 rounded animate-pulse"></div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-32 h-4 bg-neutral-200 rounded animate-pulse"></div>
                <div className="w-36 h-4 bg-neutral-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Cụm nút hành động Skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-20 h-9 bg-neutral-200 rounded-lg animate-pulse"></div>
            <div className="w-28 h-9 bg-neutral-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="px-6 mt-6 border-t border-neutral-100 flex gap-8">
          <div className="w-20 h-10 bg-neutral-200 rounded-t-lg animate-pulse mt-2"></div>
          <div className="w-32 h-10 bg-neutral-200 rounded-t-lg animate-pulse mt-2"></div>
          <div className="w-24 h-10 bg-neutral-200 rounded-t-lg animate-pulse mt-2"></div>
          <div className="w-24 h-10 bg-neutral-200 rounded-t-lg animate-pulse mt-2"></div>
        </div>
      </div>

      {/* ================= TAB CONTENT SKELETON ================= */}
      <div className="flex flex-col gap-4">
        
        {/* Card 1: Work Identity Skeleton */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="w-36 h-6 bg-neutral-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item}>
                <div className="w-20 h-3 bg-neutral-200 rounded animate-pulse mb-2"></div>
                <div className="w-32 h-4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Professional Bio Skeleton */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="w-40 h-6 bg-neutral-200 rounded animate-pulse mb-4"></div>
          <div className="flex flex-col gap-2">
            <div className="w-full h-4 bg-neutral-200 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-neutral-200 rounded animate-pulse"></div>
            <div className="w-2/3 h-4 bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Card 3: Core Skills Skeleton */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="w-32 h-6 bg-neutral-200 rounded animate-pulse mb-4"></div>
          <div className="flex flex-wrap gap-2">
            <div className="w-24 h-7 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="w-28 h-7 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-7 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="w-32 h-7 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="w-24 h-7 bg-neutral-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Card 4: Recent Activity Skeleton */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-40 h-6 bg-neutral-200 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-neutral-200 rounded animate-pulse"></div>
          </div>
          
          <div className="relative border-l-2 border-neutral-200 ml-3 pl-6 flex flex-col gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="relative">
                <span className="absolute -left-[31px] top-1 w-3 h-3 bg-neutral-200 rounded-full ring-4 ring-white animate-pulse"></span>
                <div className="w-24 h-3 bg-neutral-200 rounded animate-pulse mb-2"></div>
                <div className="w-64 h-4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}