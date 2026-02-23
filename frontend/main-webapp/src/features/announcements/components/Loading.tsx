export function Loading() {
  return(
    <section className="onfis-section">
        {/* Skeleton cho Breadcrumb */}
        <div className="w-full p-6 flex items-center bg-white rounded-t-lg border-b border-neutral-200">
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="w-full py-6 md:px-5 xl:px-8 2xl:px-16 flex flex-col justify-center bg-white rounded-b-lg">
          
          {/* Skeleton cho Tiêu đề (Title) */}
          <div className="h-8 bg-neutral-200 rounded w-3/4 mb-6 animate-pulse"></div>
          
          <div className="flex items-center justify-between py-6 border-b border-neutral-200">
            {/* Skeleton cho Avatar & Thông tin */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse"></div>
              <div className="flex flex-col gap-2 w-48">
                <div className="h-4 bg-neutral-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-neutral-200 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Skeleton cho Nội dung bài viết (Content) */}
          <div className="py-10 flex flex-col gap-3">
            <div className="h-4 bg-neutral-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-4/6 animate-pulse"></div>
          </div>

        </div>
      </section>
  )
}