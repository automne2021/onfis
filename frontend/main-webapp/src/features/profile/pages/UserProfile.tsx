import { useParams } from "react-router-dom"
import { MOCK_USERS } from "../../../data/mockUserData"
import { useState } from "react"

export function UserProfile() {

  const { id } = useParams<{ id: string }>()

  const [isLoading, setIsLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState(false)
  const [details, setDetails] = useState("")

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)
      
      setTimeout(() => {
        if (id) {
          const users = MOCK_USERS.find(
            (item) => item.id === Number(id)
          )
          
          setDetail(foundItem || null)

          if (foundItem) {
            setIsLiked(foundItem.initialIsLike || false)

            const calculatedLikes = Array.isArray(foundItem.likes) && foundItem.likes.length > 0 ? foundItem.likes.length : 0

            let calculatedComments = 0
            if (foundItem.comments && Array.isArray(foundItem.comments)) {
              calculatedComments = foundItem.comments.reduce((total, comment) => {
                const repliesCount = comment.replies ? comment.replies.length : 0
                return total + 1 + repliesCount
              }, 0)
            }

            setLikeCount(calculatedLikes)
            setCommentCount(calculatedComments)
          }
        }
        setIsLoading(false)
      }, 500)
    }
    
    fetchDetail()
  }, [id])

  return(
    <section className="onfis-section">
      {/* Basic information */}
      <div className="bg-white px-6 py-12 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          {/* Avatar */}
          <div>

          </div>
          {/* Basic info */}

        </div>

        {/* Buttons */}
      </div>

      {/* Navigation */}
    </section>
  )
}