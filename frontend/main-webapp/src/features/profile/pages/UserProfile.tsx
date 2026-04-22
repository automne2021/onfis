import { useParams, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import type { FullUserProfile } from "../../../types/userType"
import { Loading } from "../components/Loading"
import userProfileImg from "../../../assets/images/user-profile-img.png"

import { BadgeOutlined, BusinessOutlined, PlaceOutlined } from '@mui/icons-material';
import { TabGroup } from "../../../components/common/Tab/TabGroup"
import { Overview } from "./UserProfile/Overview"
import { PersonalDetails } from "./UserProfile/PersonalDetails"
import { Documents } from "./UserProfile/Documents"
import { userApi } from "../services/userApi"

const tabItems = [
  { id: 'overview', label: "Overview", isDisplay: true },
  { id: 'personal-details', label: "Personal Details", isDisplay: true },
  { id: 'documents', label: "Documents", isDisplay: true },
]

export function UserProfile() {

  const { id } = useParams<{ id: string }>()

  const [searchParams] = useSearchParams()
  const currentView = searchParams.get('view') || 'overview'

  const [isLoading, setIsLoading] = useState(true)
  const [info, setInfo] = useState<FullUserProfile | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return; // Nếu không có id trên URL thì bỏ qua

      setIsLoading(true);
      try {
        const userProfile = await userApi.getFullUserProfile(id);
        setInfo(userProfile);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        setInfo(null); // Nếu lỗi (VD: 404, 500) thì set null để hiện "User not found!"
      } finally {
        setIsLoading(false); // Luôn tắt loading dù thành công hay thất bại
      }
    };

    fetchDetail();
  }, [id]);

  console.log("Info: ", info)


  if (isLoading) return <Loading />
  if (!info) return <div className="p-10 text-center text-neutral-500">User not found!</div>

  const avatarImg = info.avatarUrl ? info.avatarUrl : userProfileImg

  return (
    <section className="onfis-section">
      {/* Basic information */}
      <div className="bg-white px-6 pt-4 pb-3 rounded-t-lg flex items-center justify-between border-b border-neutral-200 shadow-sm">
        {/* Left hand side */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-neutral-200"
          >
            <img
              src={avatarImg}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Basic info */}
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold text-neutral-900 leading-snug">{info.firstName} {info.lastName}</p>
            <div className="flex items-center gap-3 text-neutral-500 body-3-regular">
              <div className="flex items-center gap-1.5">
                <BadgeOutlined sx={{ fontSize: 18 }} />
                {info.positionName}
              </div>

              <span className="text-neutral-300">•</span>

              <div className="flex items-center gap-1.5">
                <BusinessOutlined sx={{ fontSize: 18 }} />
                {info.departmentName}
              </div>

              <span className="text-neutral-300">•</span>

              <div className="flex items-center gap-1.5">
                <PlaceOutlined sx={{ fontSize: 18 }} />
                {info.workLocation}
              </div>
            </div>
          </div>

        </div>
        {/* Buttons */}
        <div className="flex items-center gap-3">

        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white pt-1.5 px-2">
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