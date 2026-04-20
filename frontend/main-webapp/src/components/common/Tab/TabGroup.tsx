import { useSearchParams } from 'react-router-dom';

import { Tab } from './Tab';

interface TabItemProps {
  id: string
  label: string
  icon?: React.ReactNode
  isLock?: boolean
  isDisplay?: boolean
}

interface TabGroupProps {
  tabItems: TabItemProps[]
  defaultTab: string
}

export function TabGroup({ tabItems, defaultTab } : TabGroupProps) {

  // State Managements
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('view') || defaultTab

  // Functions
  const handleTabChange = (tabId: string) => {
    setSearchParams(prev => {
      prev.set('view', tabId); 
      return prev;
    });
  }

  return(
    <div className='flex'>
      {tabItems.map((item) => {
        return item.isDisplay && (
        <Tab
          key={item.id}
          label={item.label}
          icon={item.icon}
          isActive={currentTab === item.id}
          onClick={() => handleTabChange(item.id)}
          isLock={item.isLock}
        />
      )})}
    </div>
  )
}