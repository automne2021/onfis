import { LockOutlined } from '@mui/icons-material';

export function ConfidentialTag() {
  return(
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-amber-400 bg-amber-50">
      <LockOutlined className="text-amber-500" sx={{ fontSize: '14px' }} />
      <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wide">
        Confidential
      </span>
    </div>
  )
}