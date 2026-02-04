interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
}

export function IconButton ({ icon, onClick }: IconButtonProps) {
  return(
    <div 
      onClick={onClick}
      className="p-[6px] rounded-full flex items-center justify-center hover:bg-neutral-200 cursor-pointer transition"
    >
      {icon}
    </div>
  );
}

