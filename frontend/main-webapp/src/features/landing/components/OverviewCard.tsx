import { CheckCircleOutlineOutlined } from '@mui/icons-material';

interface OverviewCardProps {
  title: string
  contents: string[]
}

export default function OverviewCard({ title, contents }: OverviewCardProps) {
  return(
    <div className="shadow-lg rounded-[8px] bg-neutral-50 flex flex-col items-center w-[472px] px-4 pt-3 pb-5 transition-all duration-500 ease-out hover:scale-105">
      {/* Images */}
      {/* Grey Rectangle Placeholder */}
      <div className="w-full h-[300px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-90">
        Image Placeholder
      </div>

      {/* Text block */}
      <div className='w-full'>
        <p className="header-h6 text-primary text-left mx-6">{title}</p>
        <div className='flex flex-col gap-2 mx-6'>
          {contents.map((content, idx) => (
            <div key={idx} className='flex gap-2 items-center'>
              <CheckCircleOutlineOutlined className='text-secondary'/>
              <p className='body-2-regular text-neutral-900'>
                {content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}