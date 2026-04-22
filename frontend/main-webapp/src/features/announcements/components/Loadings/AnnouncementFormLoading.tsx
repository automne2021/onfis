export function AnnouncementFormLoading() {
  return (
    <div className="bg-white rounded-xl w-[420px] md:w-[590px] lg:w-[732px] shadow-xl border border-neutral-200 animate-pulse flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200 flex justify-between items-center px-4 py-3">
        <div className='flex items-center gap-2'>
          <div className="h-5 w-40 bg-neutral-200 rounded"></div>
          <div className="w-6 h-6 rounded-full bg-neutral-200"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-neutral-200"></div>
      </div>

      {/* Body */}
      <div className='py-4 flex flex-col gap-5 px-4 overflow-hidden'>
        
        {/* Audience Scope Section */}
        <div className='flex flex-col gap-3'>
          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
          
          {/* Option Cards */}
          <div className='flex flex-wrap items-center justify-between gap-4'>
            {/* Card 1 (Active style mock) */}
            <div className="flex-1 min-w-[200px] p-4 bg-white border-2 border-neutral-200 rounded-xl flex flex-col gap-3">
              <div className="w-10 h-8 bg-neutral-200 rounded-lg"></div>
              <div className="w-28 h-4 bg-neutral-200 rounded"></div>
              <div className="w-36 h-3 bg-neutral-200 rounded"></div>
            </div>
            
            {/* Card 2 (Inactive style mock) */}
            <div className="flex-1 min-w-[200px] p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col gap-3 opacity-70">
              <div className="w-10 h-8 bg-neutral-200 rounded-lg"></div>
              <div className="w-32 h-4 bg-neutral-200 rounded"></div>
              <div className="w-40 h-3 bg-neutral-200 rounded"></div>
            </div>
          </div>
          
          {/* Targeting Tag */}
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-16 bg-neutral-200 rounded"></div>
            <div className="h-6 w-24 bg-neutral-200 rounded-md border border-neutral-200"></div>
          </div>
        </div>

        {/* Subject Section */}
        <div className='flex flex-col gap-3'>
          <div className="h-4 w-20 bg-neutral-200 rounded"></div>
          <div className="w-full h-[46px] bg-neutral-50 border border-neutral-200 rounded-lg"></div>
        </div>

        {/* Message Content Section */}
        <div className='flex flex-col gap-3'>
          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
          
          {/* Rich Text Editor Mock */}
          <div className="w-full border border-neutral-200 rounded-lg overflow-hidden flex flex-col">
            {/* Toolbar Mock */}
            <div className="h-11 w-full bg-white border-b border-neutral-200 flex items-center px-4 gap-4">
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
              <div className="w-[1px] h-5 bg-neutral-200 mx-1"></div>
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
              <div className="w-[1px] h-5 bg-neutral-200 mx-1"></div>
              <div className="h-4 w-4 bg-neutral-200 rounded"></div>
            </div>
            {/* Text Area Mock */}
            <div className="h-28 w-full bg-neutral-50"></div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className='py-3 mt-auto border-t border-neutral-200 flex items-center justify-end gap-2 px-4 rounded-b-xl'>
        <div className="w-28 h-[38px] bg-neutral-100 border border-neutral-200 rounded-lg"></div>
        <div className="w-28 h-[38px] bg-neutral-200 rounded-lg"></div>
      </div>

    </div>
  )
}