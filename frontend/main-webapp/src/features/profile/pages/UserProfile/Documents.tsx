import { useState } from "react";
import type { UserProfile } from "../../../../types/userType";
import { DocumentCard } from "../../components/Documents/DocumentCard";
import { NavBar } from "../../components/navigation/NavBar";
import { UploadDocumentModal } from "../../components/Documents/UploadDocumentModal";

export function Documents({ userInfo } : { userInfo: UserProfile }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return(
    <div className='flex flex-col gap-2'>
      <NavBar onUploadClick={() => setIsUploadOpen(true)} />
      <div className="flex flex-wrap items-center gap-4">
        {userInfo.documents?.map((item, index) => (
          <DocumentCard 
            key={index}
            document={item}
          />
        ))}
      </div>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}