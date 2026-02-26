import { pdf, doc, xls, ppt, jpg, png, psd } from '../assets/icons/fileFormat';

export const FILE_ICONS: Record<string, string> = {
  pdf,
  docx: doc,
  doc,
  xlsx: xls,
  xls,
  ppt,
  pptx: ppt,
  jpg,
  jpeg: jpg,
  png,
  psd,
};

export const FILE_COLORS: Record<string, { bg: string; text: string }> = {
  pdf: { bg: 'bg-red-50', text: 'text-red-500' },
  docx: { bg: 'bg-sky-50', text: 'text-sky-500' },
  doc: { bg: 'bg-sky-50', text: 'text-sky-500' }, // Đã sửa lỗi bg-sky-500 thành text-sky-500 của bạn
  xlsx: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  xls: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  ppt: { bg: 'bg-orange-50', text: 'text-orange-500' },
  pptx: { bg: 'bg-orange-50', text: 'text-orange-500' },
  jpg: { bg: 'bg-amber-50', text: 'text-amber-500' },
  jpeg: { bg: 'bg-amber-50', text: 'text-amber-500' },
  png: { bg: 'bg-teal-50', text: 'text-teal-500' },
  psd: { bg: 'bg-indigo-50', text: 'text-indigo-500' },
  default: { bg: 'bg-neutral-100', text: 'text-neutral-500' }
};

export const getFileType = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';