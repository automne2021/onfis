import { useSearchParams } from 'react-router-dom';

import { PushPin } from '@mui/icons-material';
import { Tab } from './Tab';

const tabItems = [
  { id: 'all', label: "All News" },
  { id: 'department', label: "My Department" },
  { id: 'company', label: "Company Wide" },
  { id: 'pinned', label: "Pinned", icon: <PushPin fontSize='small'/> },
]

export function TabGroup() {

  // State Managements
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('view') || 'all'

  // Functions
  const handleTabChange = (tabId: string) => {
    // Update URL: ?view=department
    // Đổi tab nhưng không làm mất kết quả tìm kiếm
    setSearchParams(prev => {
      prev.set('view', tabId); 
      return prev;
    });
  }

  return(
    <div className='flex'>
      {tabItems.map((item) => (
        <Tab
          key={item.id}
          label={item.label}
          icon={item.icon}
          isActive={currentTab === item.id}
          onClick={() => handleTabChange(item.id)}
        />
      ))}
    </div>
  )
}