export function AnnouncementLoading() {
  // Lặp ra 3 thẻ card để tạo thành 1 danh sách giống hệt giao diện thật
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-white py-4 px-5 rounded-xl border border-neutral-200 shadow-sm animate-pulse">
          
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-neutral-200"></div>
              {/* Name & Time */}
              <div className="flex flex-col gap-1.5">
                <div className="w-24 h-4 bg-neutral-200 rounded"></div>
                <div className="w-40 h-3 bg-neutral-200 rounded"></div>
              </div>
            </div>
            
            {/* Tags (2 tags góc phải giống trong ảnh) */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-7 bg-neutral-200 rounded-full"></div>
              <div className="w-24 h-7 bg-neutral-200 rounded-full"></div>
            </div>
          </div>

          {/* Body Skeleton */}
          <div className="flex flex-col gap-0 mt-2">
            {/* Title (Chữ to in đậm) */}
            <div className="w-48 h-6 bg-neutral-200 rounded mt-2"></div>
            
            {/* Content lines */}
            <div className="w-32 h-4 bg-neutral-200 rounded mt-2"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between border-t border-neutral-200 mt-3 pt-3">
            {/* Read more link */}
            <div className="w-20 h-4 bg-neutral-200 rounded"></div>
            
            {/* Like & Comment buttons */}
            <div className="flex items-center gap-6">
              {/* Nút Like */}
              <div className="w-12 h-4 bg-neutral-200 rounded"></div>
              {/* Nút Comment */}
              <div className="w-20 h-4 bg-neutral-200 rounded"></div>
            </div>
          </div>
          
        </div>
      ))}
    </div>
  )
}