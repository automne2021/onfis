import { 
  BadgeOutlined, 
  PortraitOutlined, 
  PsychologyOutlined,
  RestoreOutlined 
} from '@mui/icons-material';
import type { UserProfile } from '../../../../types/userType';

import { WorkIdentity } from '../../components/Overview/WorkIdentity';
import { ProfessionalBio } from '../../components/Overview/ProfessionalBio';
import { CoreSkills } from '../../components/Overview/CoreSkills';
import { RecentActivity } from '../../components/Overview/RecentActivity';

export function Overview( { userInfo } : { userInfo: UserProfile } ) {
  return(
    <div className='flex flex-col gap-2'>
      <WorkIdentity icon={<BadgeOutlined />} userInfo={userInfo} />
      <ProfessionalBio icon={<PortraitOutlined />} userInfo={userInfo}/>
      <CoreSkills icon={<PsychologyOutlined />} userInfo={userInfo} />
      <RecentActivity icon={<RestoreOutlined />} userInfo={userInfo} />
    </div>
  )
}