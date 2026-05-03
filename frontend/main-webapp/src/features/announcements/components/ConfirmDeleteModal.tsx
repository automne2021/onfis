import { Close } from "@mui/icons-material";
import { Button } from "../../../components/common/Buttons/Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[400px] shadow-xl border border-neutral-200">
        <div className="border-b border-neutral-200 flex justify-between items-center px-4 py-3">
          <p className="text-base font-bold text-neutral-900">Delete Announcement</p>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100 transition">
            <Close className="text-neutral-500" fontSize="small" />
          </button>
        </div>
        <div className="p-5">
          <p className="body-2-regular text-neutral-700">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </p>
        </div>
        <div className="py-3 px-4 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <Button 
            onClick={onClose} 
            style="sub"
            disabled={isDeleting} 
            className="body-3-medium text-neutral-600">
            Cancel
          </Button>
          <Button
            title="Delete"
            onClick={onConfirm}
            style="custom"
            loading={isDeleting}
            className="bg-red-200 hover:!bg-red-300 shadow-red-600/20 text-red-600 border-red-500"
          />
        </div>
      </div>
    </div>
  );
}