import { 
  ContactsOutlined, 
  SchoolOutlined, 
  FingerprintOutlined,
  EmergencyOutlined,
  PaymentsOutlined, 
  HistoryEduOutlined, 
  PaymentOutlined
} from '@mui/icons-material';
import { ContactInformation } from '../../components/PersonalDetails/ContactInfo';
import type { UserProfile } from '../../../../types/userType';
import { Identification } from '../../components/PersonalDetails/Identification';
import { Education } from '../../components/PersonalDetails/Education';
import { BankingAndTax } from '../../components/PersonalDetails/BankingAndTax';
import { FamilyAndEmergency } from '../../components/PersonalDetails/FamilyAndEmergency';
import { PayrollAndCompensation } from '../../components/PersonalDetails/PayrollAndCompensation';
import { EmploymentContract } from '../../components/PersonalDetails/EmploymentContract';

export function PersonalDetails({ userInfo, role } : { userInfo: UserProfile, role?: string }) {
  
  const allowedRole = ['hr', 'admin']
  
  return(
    <div className='flex flex-col gap-2'>
      <ContactInformation icon={<ContactsOutlined />} userInfo={userInfo} role={role}/>
      <Identification icon={<FingerprintOutlined />} userInfo={userInfo} role={role} />
      <Education icon={<SchoolOutlined />} userInfo={userInfo} />
      {role && allowedRole.includes(role) && (
        <>
          <FamilyAndEmergency icon={<EmergencyOutlined />} userInfo={userInfo} />
          <BankingAndTax icon={<PaymentOutlined />} userInfo={userInfo} />
          <PayrollAndCompensation icon={<PaymentsOutlined />} userInfo={userInfo} />
          <EmploymentContract icon={<HistoryEduOutlined />} userInfo={userInfo} />
        </>
      )}
    </div>
  )
}