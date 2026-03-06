import { useState } from "react";
import Modal from "../../../components/common/Modal";

interface SubmitTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskTitle: string;
    onSubmit: (data: { notes: string; actualEffort: number }) => void;
}

export default function SubmitTaskModal({
    isOpen,
    onClose,
    taskTitle,
    onSubmit,
}: SubmitTaskModalProps) {
    const [notes, setNotes] = useState("");
    const [actualEffort, setActualEffort] = useState<number>(0);

    const handleSubmit = () => {
        onSubmit({ notes: notes.trim(), actualEffort });
        setNotes("");
        setActualEffort(0);
        onClose();
    };

    const handleCancel = () => {
        setNotes("");
        setActualEffort(0);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Submit Task for Review"
            maxWidth="md"
            footer={
                <>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md shadow-amber-500/20 transition-all"
                    >
                        Submit for Review
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Task being submitted */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Task</span>
                    <p className="text-sm font-semibold text-neutral-900 mt-1">{taskTitle}</p>
                </div>

                {/* Status change indicator */}
                <div className="flex items-center gap-3 justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-blue-700">In Progress</span>
                    </div>
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-neutral-400">
                        <path d="M14 1L19 6M19 6L14 11M19 6H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-amber-700">In Review</span>
                    </div>
                </div>

                {/* Completion Notes */}
                <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Completion Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe what was completed, any decisions made, or things to note for the reviewer..."
                        className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-neutral-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-neutral-50 text-neutral-900 text-sm resize-none outline-none transition-colors placeholder:text-neutral-400"
                    />
                </div>

                {/* Actual Effort */}
                <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Actual Effort (hours)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={actualEffort || ""}
                        onChange={(e) => setActualEffort(Number(e.target.value) || 0)}
                        placeholder="e.g. 8"
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-neutral-50 text-neutral-900 text-sm transition-colors placeholder:text-neutral-400"
                    />
                </div>

                {/* Attachments placeholder */}
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center">
                    <div className="text-2xl mb-2">📎</div>
                    <p className="text-sm font-medium text-neutral-500">Drag & drop files here or click to browse</p>
                    <p className="text-xs text-neutral-400 mt-1">Supports images, PDFs, and documents</p>
                </div>
            </div>
        </Modal>
    );
}
