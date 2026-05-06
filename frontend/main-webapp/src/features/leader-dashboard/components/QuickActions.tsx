import { useNavigate } from "react-router-dom";
import Icon from "../../../components/common/Icon";

interface QuickActionsProps {
  tenant: string;
}

const actions = [
  {
    label: "Delegation",
    desc: "Create and track tasks",
    icon: <Icon name="assignment_ind" size={24} color="currentColor" />,
    path: "delegation",
    color: "from-indigo-500 to-purple-500",
    bgLight: "bg-indigo-50",
  },
  {
    label: "Positions",
    desc: "Manage org chart",
    icon: <Icon name="account_tree" size={24} color="currentColor" />,
    path: "positions",
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
  },
  {
    label: "Announcements",
    desc: "Company-wide communications",
    icon: <Icon name="campaign" size={24} color="currentColor" />,
    path: "announcements",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
  },
  {
    label: "Projects",
    desc: "Manage projects & tasks",
    icon: <Icon name="dashboard" size={24} color="currentColor" />,
    path: "projects",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
  },
  {
    label: "Discussions",
    desc: "Internal chat & exchange",
    icon: <Icon name="forum" size={24} color="currentColor" />,
    path: "discuss",
    color: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50",
  },
];

export default function QuickActions({ tenant }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-6">
      <h3 className="text-base font-semibold text-neutral-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action, i) => (
          <button
            key={action.path}
            onClick={() => navigate(`/${tenant}/${action.path}`)}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-neutral-200/80 hover:border-indigo-200 hover:shadow-md transition-all duration-200 animate-page-enter"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl ${action.bgLight} flex items-center justify-center text-neutral-600 group-hover:scale-110 transition-transform duration-200`}>
              {action.icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-800">{action.label}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
