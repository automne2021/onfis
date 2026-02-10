import { Close } from '@mui/icons-material';

interface OptionTagProps {
  label: string
  onDelete: () => void
}

export function OptionTag({ label, onDelete } : OptionTagProps) {
  return(
    <div className="p-2 bg-neutral-200 flex items-center justify-between gap-2 rounded-[6px]">
      <p className="body-4-regular text-neutral-600">{label}</p>
      <button
        type='button'
        onClick={onDelete}
        className='p-1 text-neutral-600 hover:bg-neutral-300 rounded-full transition flex items-center '
      >
        <Close sx={{ fontSize: 12 }} />
      </button>
    </div>
  )
}