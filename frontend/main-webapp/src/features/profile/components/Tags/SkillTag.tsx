export function SkillTags({ label } : { label: string }) {
  return(
    <div className="px-3 py-2 rounded-full bg-secondary text-primary body-4-regular">
      <p>{label}</p>
    </div>
  )
}