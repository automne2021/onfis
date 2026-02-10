import { DeleteOutline, InsertDriveFile } from '@mui/icons-material';
import { formatFileSize } from '../../../utils/format';
import { FILE_ICONS, FILE_COLORS } from '../../../config/fileConfig';

interface FileTagProps {
  type?: string;
  name: string;
  size: number;
  onRemove: () => void;
}

export function FileTag({ type, name, size, onRemove }: FileTagProps) {
  const iconSrc = type ? FILE_ICONS[type] : undefined;
  const theme = (type && FILE_COLORS[type]) ? FILE_COLORS[type] : FILE_COLORS.default;

  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-neutral-200 rounded-xl bg-white hover:border-primary/50 transition-all group">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-2.5 ${theme.bg} ${theme.text} rounded-lg flex items-center justify-center`}>
          {iconSrc ? (
            <img src={iconSrc} alt={type} className="w-6 h-6 object-contain" />
          ) : (
            <InsertDriveFile fontSize="small" className="text-primary" />
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="body-3-medium text-neutral-900 truncate">{name}</span>
          <span className="text-xs text-neutral-500">{formatFileSize(size)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <DeleteOutline fontSize="small" />
      </button>
    </div>
  );
}