import React, { useState, useEffect } from 'react';
import {
  KeyboardDoubleArrowLeft,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowRight
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [inputValue, setInputValue] = useState((currentPage + 1).toString());

  useEffect(() => {
    setInputValue((currentPage + 1).toString());
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
  };

  const handleJumpToPage = () => {
    let page = parseInt(inputValue, 10);
    
    if (isNaN(page) || page < 1) {
      page = 1;
    } 
    else if (page > totalPages) {
      page = totalPages;
    }
    
    setInputValue(page.toString());
    onPageChange(page - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        className={`p-1.5 rounded-md border mb-[2px] ${currentPage === 0 ? 'text-neutral-300 border-neutral-100 bg-neutral-50' : 'text-neutral-500 border-neutral-300 hover:bg-cyan-50 hover:text-primary hover:border-primary'} transition`}
      >
        <KeyboardDoubleArrowLeft fontSize="small" />
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`p-1.5 rounded-full border mb-[2px] ${currentPage === 0 ? 'text-neutral-300 border-neutral-100 bg-neutral-50' : 'text-neutral-500 border-neutral-300 hover:bg-cyan-50 hover:text-primary hover:border-primary'} transition`}
      >
        <KeyboardArrowLeft fontSize="small" />
      </button>

      <div className="flex items-center gap-1 mx-2 body-3-regular text-neutral-500">
        <span className='mb-[2px]'>Page</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleJumpToPage}     
          onKeyDown={handleKeyDown}     
          className="min-w-[1ch] [field-sizing:content] text-center bg-transparent border-0 border-b-2 border-transparent p-1 transition focus:outline-none focus:border-b-primary"
        />
        <span className='mb-[2px] mx-[2px]'>/</span>
        <span className='mb-[2px]'>{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={`p-1.5 rounded-md border mb-[2px] ${currentPage >= totalPages - 1 ? 'text-neutral-300 border-neutral-100 bg-neutral-50' : 'text-neutral-500 border-neutral-300 hover:bg-cyan-50 hover:text-primary hover:border-primary'} transition`}
      >
        <KeyboardArrowRight fontSize="small" />
      </button>

      <button
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage >= totalPages - 1}
        className={`p-1.5 rounded-md border mb-[2px] ${currentPage >= totalPages - 1 ? 'text-neutral-300 border-neutral-100 bg-neutral-50' : 'text-neutral-500 border-neutral-300 hover:bg-cyan-50 hover:text-primary hover:border-primary'} transition`}
      >
        <KeyboardDoubleArrowRight fontSize="small" />
      </button>
    </div>
  );
}