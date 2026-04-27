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
import type { FullUserProfile } from '../../../../types/userType';
import { Identification } from '../../components/PersonalDetails/Identification';
import { Education } from '../../components/PersonalDetails/Education';
import { BankingAndTax } from '../../components/PersonalDetails/BankingAndTax';
import { FamilyAndEmergency } from '../../components/PersonalDetails/FamilyAndEmergency';
import { PayrollAndCompensation } from '../../components/PersonalDetails/PayrollAndCompensation';
import { EmploymentContract } from '../../components/PersonalDetails/EmploymentContract';

export function PersonalDetails({ userInfo } : { userInfo: FullUserProfile }) {
  
  // Backend trả về null nếu không có quyền. Ta chỉ cần ép kiểu sang boolean để check.
  const hasEmergency = !!userInfo.emergencyContact;
  const hasBanking = !!userInfo.bankingInfo;
  const hasPayroll = !!userInfo.compensationInfo;
  const hasContract = !!userInfo.contractInfo;
  
  return(
    <div className='flex flex-col gap-2'>
      <ContactInformation icon={<ContactsOutlined />} userInfo={userInfo} />
      <Identification icon={<FingerprintOutlined />} userInfo={userInfo} />
      <Education icon={<SchoolOutlined />} userInfo={userInfo} />
      
      {/* Chỉ render khi Backend cho phép (có trả về data) */}
      {hasEmergency && <FamilyAndEmergency icon={<EmergencyOutlined />} userInfo={userInfo} />}
      {hasBanking && <BankingAndTax icon={<PaymentOutlined />} userInfo={userInfo} />}
      {hasPayroll && <PayrollAndCompensation icon={<PaymentsOutlined />} userInfo={userInfo} />}
      {hasContract && <EmploymentContract icon={<HistoryEduOutlined />} userInfo={userInfo} />}
    </div>
  )
}