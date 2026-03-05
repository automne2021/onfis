import { NavLink } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import Icon from "../common/Icon";
import { CollapseIcon } from "../common/Icons";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex items-center rounded-lg transition-all duration-200 ease-out overflow-hidden
       ${isCollapsed ? "w-full h-10" : "w-full h-10 pr-3"}
       ${isActive
        ? "bg-primary/8 text-primary shadow-sm"
        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Active indicator bar */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-out
            ${isActive ? "h-5 bg-primary opacity-100" : "h-0 bg-transparent opacity-0"}
          `}
        />

        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Icon
            name={icon}
            size={20}
            color={isActive ? "#0014A8" : "#62748E"}
            className="transition-transform duration-200 group-hover:scale-110"
          />
        </div>

        <span
          className={`body-3-regular whitespace-nowrap overflow-hidden text-ellipsis 
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCollapsed ? "opacity-0" : "opacity-100 delay-75"}
            ${isActive ? "text-primary font-semibold" : ""}`}
        >
          {label}
        </span>

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded-md
                          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200
                          whitespace-nowrap z-50 shadow-lg">
            {label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45 rounded-sm" />
          </div>
        )}
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems: Omit<NavItemProps, "isCollapsed">[] = [
    { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/announcements", icon: "campaign", label: "Announce" },
    { to: "/discuss", icon: "forum", label: "Discuss" },
    { to: "/positions", icon: "account_tree", label: "Position" },
    { to: "/projects", icon: "view_kanban", label: "Project" },
  ];

  return (
    <aside
      className={`bg-white flex flex-col items-center gap-1 py-3 rounded-xl shadow-sm border border-neutral-100 sticky top-[72px] self-start h-[calc(100vh-60px-24px)]
                   transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
                   ${isCollapsed ? "w-[56px] px-2" : "w-[160px] px-2"}`}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`flex items-center rounded-lg transition-all duration-200
                    hover:bg-neutral-100 active:scale-95 mb-1
                    ${isCollapsed ? "w-10 h-8" : "w-full h-8"}`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="w-10 h-full flex items-center justify-center shrink-0">
          <CollapseIcon collapsed={isCollapsed} />
        </div>
      </button>

      {/* Subtle divider */}
      <div className={`h-px bg-neutral-100 transition-all duration-300 mb-1 ${isCollapsed ? "w-8" : "w-full"}`} />

      {/* Navigation Items */}
      <nav className="flex flex-col items-center gap-1 w-full">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Spacer pushes Settings to bottom */}
      <div className="flex-1" />

      {/* Bottom divider */}
      <div className={`h-px bg-neutral-100 transition-all duration-300 ${isCollapsed ? "w-8" : "w-full"}`} />

      {/* Settings Button */}
      <NavItem
        to="/settings"
        icon="settings"
        label="Settings"
        isCollapsed={isCollapsed}
      />
    </aside>
  );
}