import { Fragment, useEffect, useRef } from "react";
import { Transition } from "@headlessui/react";

interface DropdownProps {
  isOpen: boolean;
  trigger: React.ReactNode;  // trigger button
  children: React.ReactNode; // dropdown's content
  widthClass?: string;       // Class modifies the width 
  onClose?: () => void;
}

export default function Dropdown({ 
  isOpen, 
  trigger, 
  children, 
  widthClass = "w-48", // default value
  onClose
}: DropdownProps) {

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    // Attach event when component mount
    document.addEventListener("mousedown", handleClickOutside)

    // Remove event
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className={`absolute z-50 right-0 mt-2 ${widthClass} origin-top-right rounded-md bg-white shadow-lg focus:outline-none`}>
          <div className="py-1">
            {children}
          </div>
        </div>
      </Transition>
    </div>
  );
}