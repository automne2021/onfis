import type { UserProfile } from "../../../../types/userType";
import { DocumentCard } from "../../components/Documents/DocumentCard";
import { NavBar } from "../../components/navigation/NavBar";

export function Documents({ userInfo } : { userInfo: UserProfile }) {
  return(
    <div className='flex flex-col gap-2'>
      <NavBar />
      <div className="flex flex-wrap items-center gap-4">
        {userInfo.documents?.map((item, index) => (
          <DocumentCard 
            key={index}
            document={item}
          />
        ))}
      </div>
    </div>
  )
}