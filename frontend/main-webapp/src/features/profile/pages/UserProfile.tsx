import { useParams } from "react-router-dom"

export function UserProfile() {

  const { id } = useParams<{ id: string }>()

  return(
    <section className="onfis-section">
      {/* Basic information */}


      {/* Navigation */}
    </section>
  )
}