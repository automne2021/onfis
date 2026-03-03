import { useParams, useSearchParams } from "react-router-dom"
import { MOCK_USERS } from "../../../data/mockUserData"
import { useEffect, useState } from "react"
import type { UserProfile } from "../../../types/userType"
import { Loading } from "../components/Loading"
import userProfileImg from "../../../assets/images/user-profile-img.png"

import { BadgeOutlined, BusinessOutlined, PlaceOutlined } from '@mui/icons-material';
import { TabGroup } from "../../../components/common/Tab/TabGroup"
import { Overview } from "./UserProfile/Overview"
import { PersonalDetails } from "./UserProfile/PersonalDetails"
import { Documents } from "./UserProfile/Documents"

const tabItems = [
  { id: 'overview', label: "Overview", isDisplay: true },
  { id: 'personal-details', label: "Personal Details", isDisplay: true },
  { id: 'documents', label: "Documents", isDisplay: true},
]

export function UserProfile() {

  const { id } = useParams<{ id: string }>()

  const [searchParams] = useSearchParams()
  const currentView = searchParams.get('view') || 'overview'

  const [isLoading, setIsLoading] = useState(true)
  const [info, setInfo] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)
      
      setTimeout(() => {
        if (id) {
          const user = MOCK_USERS.find(
            (item) => item.id === Number(id)
          )
          setInfo(user || null)
        }
        setIsLoading(false)
      }, 500)
    }
    fetchDetail()
  }, [id])

  
  if (isLoading) return <Loading />
  if (!info) return <div className="p-10 text-center text-neutral-500">User not found!</div>

  const avatarImg = info.avatarUrl ? info.avatarUrl : userProfileImg

  return(
    <section className="onfis-section">
      {/* Basic information */}
      <div className="bg-white px-10 pt-12 pb-6 rounded-t-lg flex items-center justify-between border-b border-neutral-200">
        {/* Left hand side */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div 
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          >
            <img 
              src={avatarImg}
              alt="User Avatar"
              className="w-full h-full object-cover"
              />
          </div>
          {/* Basic info */}
          <div className="flex flex-col gap-3">
            <p className="header-h5 text-neutral-900 leading-none">{info.name}</p>
            <div className="flex items-center gap-4 text-neutral-500 body-2-regular">
              <div className="flex items-center gap-2">
                <BadgeOutlined />
                {info.position}
              </div>

              <span className="mx-2 text-neutral-300">•</span>

              <div className="flex items-center gap-2">
                <BusinessOutlined />
                {info.department}
              </div>

              <span className="mx-2 text-neutral-300">•</span>

              <div className="flex items-center gap-2">
                <PlaceOutlined />
                {info.location}
              </div>
            </div>
          </div>

        </div>
        {/* Buttons */}
        <div className="flex items-center gap-3">

        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white pt-2 px-2">
        <TabGroup tabItems={tabItems} defaultTab="overview" />
      </div>

      <div className="my-2">
        {currentView === 'overview' && (
          <Overview userInfo={info} />
        )}

        {currentView === 'personal-details' && (
          <PersonalDetails userInfo={info} role="admin" />
        )}

        {currentView === 'documents' && (
          <Documents userInfo={info} />
        )}
      </div>


      
    </section>
  )
}