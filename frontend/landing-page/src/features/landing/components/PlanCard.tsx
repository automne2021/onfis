import {
  CheckCircleOutlineOutlined
}from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface PlanCardProps {
  isBestOption: boolean
  type: string
  description: string
  price: string
  priceDescription: string
  contents: string[]
}

export default function PlanCard({ isBestOption, type, description, price, priceDescription, contents } : PlanCardProps) {
  return(
    <div 
      className={`w-[472px] border-2 px-[44px] rounded-[8px] transition-all duration-500 ease-out hover:scale-105 hover:z-20 ${isBestOption ? "bg-primary py-[64px] " : "bg-neutral-50 py-[40px] border-primary"} relative`}
    >
      {isBestOption && (
        <div className='absolute top-0 right-0 body-1-medium text-neutral-50 px-4 py-3 rounded-[4px] animate-gradient-x bg-gradient-to-r from-primary-hover via-secondary-hover to-secondary'>
          Best Option
        </div>
      )}
      <p 
        className={`header-h5 ${isBestOption ? "text-neutral-50" : "text-primary"}`}
      >
        {type}
      </p>
      <p 
        className={`body-1-regular ${isBestOption ? "text-neutral-50" : "text-neutral-900"}`}
      >
        {description}
      </p>
      <p 
        className={`header-h4 ${isBestOption ? "text-neutral-50" : "text-primary"}`}
      >
        ${price}
      </p>
      <p 
        className={`body-2-regular ${isBestOption ? "text-neutral-50" : "text-neutral-700"}`}
      >
        {priceDescription}
      </p>
      {/* Contents */}
      <div className='flex flex-col gap-2 my-6'>
        {contents.map((item, idx) => (
          <div key={idx} className='flex gap-2'>
            <CheckCircleOutlineOutlined className='text-secondary' />
            <p className={`body-2-regular ${isBestOption ? "text-neutral-50" : "text-neutral-900"} `}>
              {item}
            </p>
          </div>
        ))}
      </div>
      <Link 
        to={`/`}
        className={`px-6 py-3 rounded-[8px] text-neutral-50 transition ${isBestOption ? "bg-secondary hover:bg-secondary-hover " : "bg-primary hover:bg-primary-hover"}`}
      >
        Get Started
      </Link>
    </div>
  )
}