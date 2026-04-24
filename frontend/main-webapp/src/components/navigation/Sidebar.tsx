import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import { useRole } from "../../hooks/useRole";
import { useTenantPath } from "../../hooks/useTenantPath";
import Icon from "../common/Icon";
import { CollapseIcon } from "../common/Icons";

interface SubItem {
  to: string;
  label: string;
  icon: string;
  managerOnly?: boolean;
  employeeOnly?: boolean;
}

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isCollapsed: boolean;
}

interface NavItemWithFlyoutProps extends NavItemProps {
  subItems: SubItem[];
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group relative flex flex-col items-center justify-center rounded-lg transition-all duration-200 ease-out
       ${isCollapsed ? "w-10 h-10" : "w-full py-2 px-1"}
       ${isActive
        ? "bg-primary/8 text-primary shadow-sm"
        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-out
            ${isActive ? "h-5 bg-primary opacity-100" : "h-0 bg-transparent opacity-0"}`}
        />
        <Icon
          name={icon}
          size={20}
          color={isActive ? "#0014A8" : "#62748E"}
          className="transition-transform duration-200 group-hover:scale-110"
        />
        {!isCollapsed && (
          <span className={`text-[10px] leading-tight font-medium text-center mt-1 transition-colors ${isActive ? "text-primary font-semibold" : ""}`}>
            {label}
          </span>
        )}
      </>
    )}
  </NavLink>
);

// Flyout panel rendered in a portal so it isn't clipped by the sidebar's overflow
const FlyoutPanel = ({
  items,
  position,
  onMouseEnter,
  onMouseLeave,
}: {
  items: SubItem[];
  position: { top: number; left: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) =>
  createPortal(
    <div
      className="fixed z-[200] bg-white rounded-xl shadow-xl border border-neutral-200 py-2 w-52 animate-fadeIn"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
        Projects
      </p>
      {items.map((item) => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-2.5 mx-1 px-3 py-2 text-sm rounded-lg transition-colors
             ${isActive
              ? "bg-primary/8 text-primary font-medium"
              : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} size={16} color={isActive ? "#0014A8" : "#62748E"} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </div>,
    document.body
  );

const NavItemWithFlyout = ({ to, icon, label, isCollapsed, subItems }: NavItemWithFlyoutProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isManager, isEmployee } = useRole();
  const { pathname } = useLocation();

  const visibleItems = subItems.filter(
    (item) => (!item.managerOnly || isManager) && (!item.employeeOnly || isEmployee)
  );

  const showPanel = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.top, left: rect.right + 8 });
    }
    setIsVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setIsVisible(false), 150);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const isActive =
    pathname.includes("/projects") ||
    pathname.includes("/my-tasks");

  return (
    <div
      ref={itemRef}
      className="relative w-full"
      onMouseEnter={showPanel}
      onMouseLeave={scheduleHide}
    >
      <NavLink
        to={to}
        className={`group relative flex flex-col items-center justify-center rounded-lg transition-all duration-200 ease-out
          ${isCollapsed ? "w-10 h-10" : "w-full py-2 px-1"}
          ${isActive
            ? "bg-primary/8 text-primary shadow-sm"
            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
          }`}
      >
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-out
            ${isActive ? "h-5 bg-primary opacity-100" : "h-0 bg-transparent opacity-0"}`}
        />
        <Icon
          name={icon}
          size={20}
          color={isActive ? "#0014A8" : "#62748E"}
          className="transition-transform duration-200 group-hover:scale-110"
        />
        {!isCollapsed && (
          <span className={`text-[10px] leading-tight font-medium text-center mt-1 transition-colors ${isActive ? "text-primary font-semibold" : ""}`}>
            {label}
          </span>
        )}
        {/* Tiny chevron hint when expanded */}
        {!isCollapsed && (
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="none"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-30"
          >
            <path d="M3 2L5 4L3 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </NavLink>

      {isVisible && visibleItems.length > 0 && (
        <FlyoutPanel
          items={visibleItems}
          position={panelPos}
          onMouseEnter={showPanel}
          onMouseLeave={scheduleHide}
        />
      )}
    </div>
  );
};

export default function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { withTenant } = useTenantPath();
  const { isManager, isSuperAdmin } = useRole();

  const projectSubItems: SubItem[] = [
    { to: withTenant("/projects"), label: "All Projects", icon: "view_kanban" },
    { to: withTenant("/my-tasks"), label: "My Tasks", icon: "task_alt" },
    { to: withTenant("/projects/reviews"), label: "Review Queue", icon: "rate_review", managerOnly: true },
    { to: withTenant("/projects/reviews"), label: "My Reviews", icon: "send", employeeOnly: true },
  ];

  const navItems: Omit<NavItemProps, "isCollapsed">[] = [
    { to: withTenant("/dashboard"), icon: "dashboard", label: "Dashboard" },
    { to: withTenant("/announcements"), icon: "campaign", label: "Announce" },
    { to: withTenant("/discuss"), icon: "forum", label: "Discuss" },
    { to: withTenant("/positions"), icon: "account_tree", label: "Position" },
    ...(isSuperAdmin ? [{ to: withTenant("/delegation"), icon: "assignment_ind", label: "Delegate" }] : []),
  ];

  return (
    <aside
      className={`bg-white flex flex-col items-center gap-1 py-3 rounded-xl shadow-md border-2 border-neutral-200 sticky top-0 self-start h-[calc(100vh-60px-16px)]
                   transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-visible
                   ${isCollapsed ? "w-[56px] px-2" : "w-[80px] px-1.5"}`}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`flex items-center justify-center rounded-lg transition-all duration-200
                    hover:bg-neutral-100 active:scale-95 mb-1
                    ${isCollapsed ? "w-10 h-8" : "w-full h-8"}`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <CollapseIcon collapsed={isCollapsed} />
      </button>

      {/* Subtle divider */}
      <div className={`h-px bg-neutral-100 transition-all duration-300 mb-1 ${isCollapsed ? "w-8" : "w-full"}`} />

      {/* Navigation Items */}
      <nav className="flex flex-col items-center gap-1 w-full">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
        ))}

        {/* Projects item with flyout sub-menu */}
        <NavItemWithFlyout
          to={withTenant("/projects")}
          icon="view_kanban"
          label="Project"
          isCollapsed={isCollapsed}
          subItems={projectSubItems}
        />
      </nav>

      {/* Spacer pushes Settings to bottom */}
      <div className="flex-1" />

      {/* Bottom divider */}
      <div className={`h-px bg-neutral-100 transition-all duration-300 ${isCollapsed ? "w-8" : "w-full"}`} />

      {/* Settings Button */}
      {(isManager || isSuperAdmin) && (
        <NavItem
          to={withTenant("/settings")}
          icon="settings"
          label="Settings"
          isCollapsed={isCollapsed}
        />
      )}
    </aside>
  );
}
