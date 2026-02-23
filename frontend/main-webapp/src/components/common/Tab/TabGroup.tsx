import { useSearchParams } from 'react-router-dom';

import { Tab } from './Tab';

interface TabItemProps {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabGroupProps {
  tabItems: TabItemProps[]
}

export function TabGroup({ tabItems } : TabGroupProps) {

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