import { useState } from "react";

// ========== ICONS ==========
const CheckboxIcon = ({ checked }: { checked: boolean }) => (
  <div
    className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer
      ${checked ? "bg-primary" : "bg-neutral-200"}`}
  >
    {checked && (
      <svg
        width="12"
        height="9"
        viewBox="0 0 14 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 5L5 9L13 1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </div>
);

const CountBadge = ({ count }: { count: number }) => (
  <div className="relative w-5 h-5">
    <div className="absolute inset-0 rounded-full bg-neutral-200" />
    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-500">
      {count}
    </span>
  </div>
);

const UnassignedAvatar = () => (
  <div className="w-7 h-7 rounded-full border-2 border-dashed border-neutral-400 flex items-center justify-center">
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" stroke="#90A1B9" strokeWidth="2" />
      <path
        d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20"
        stroke="#90A1B9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

// ========== TYPES ==========
export interface Employee {
  id: string;
  name: string;
  avatar?: string;
  workPhone?: string;
  workEmail?: string;
  jobPosition: string;
  manager?: {
    id: string;
    name: string;
    avatar?: string;
  };
  isVacant?: boolean;
}

export interface Department {
  id: string;
  name: string;
  employees: Employee[];
}

interface PositionListViewProps {
  departments: Department[];
  onEmployeeClick?: (employee: Employee) => void;
  selectedEmployees?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// ========== SUBCOMPONENTS ==========
interface DepartmentRowProps {
  department: Department;
  isExpanded: boolean;
  onToggle: () => void;
  selectedEmployees: string[];
  onSelectionChange: (ids: string[]) => void;
  onEmployeeClick?: (employee: Employee) => void;
}

function DepartmentRow({
  department,
  isExpanded,
  onToggle,
  selectedEmployees,
  onSelectionChange,
  onEmployeeClick,
}: DepartmentRowProps) {
  const allSelected = department.employees.every((emp) =>
    selectedEmployees.includes(emp.id)
  );

  const handleDepartmentSelect = () => {
    if (allSelected) {
      onSelectionChange(
        selectedEmployees.filter(
          (id) => !department.employees.find((emp) => emp.id === id)
        )
      );
    } else {
      const newIds = department.employees
        .map((emp) => emp.id)
        .filter((id) => !selectedEmployees.includes(id));
      onSelectionChange([...selectedEmployees, ...newIds]);
    }
  };

  return (
    <>
      {/* Department Header */}
      <tr
        className="bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
        onClick={onToggle}
      >
        <td className="px-2 py-1.5">
          <div onClick={(e) => { e.stopPropagation(); handleDepartmentSelect(); }}>
            <CheckboxIcon
              checked={allSelected && department.employees.length > 0}
            />
          </div>
        </td>
        <td colSpan={6} className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-500">{department.name}</span>
            <CountBadge count={department.employees.length} />
          </div>
        </td>
      </tr>

      {/* Employee Rows */}
      {isExpanded &&
        department.employees.map((employee) => (
          <EmployeeRow
            key={employee.id}
            employee={employee}
            isSelected={selectedEmployees.includes(employee.id)}
            onSelect={() => {
              if (selectedEmployees.includes(employee.id)) {
                onSelectionChange(
                  selectedEmployees.filter((id) => id !== employee.id)
                );
              } else {
                onSelectionChange([...selectedEmployees, employee.id]);
              }
            }}
            onClick={() => onEmployeeClick?.(employee)}
          />
        ))}
    </>
  );
}

interface EmployeeRowProps {
  employee: Employee;
  isSelected: boolean;
  onSelect: () => void;
  onClick?: () => void;
}

function EmployeeRow({
  employee,
  isSelected,
  onSelect,
  onClick,
}: EmployeeRowProps) {
  return (
    <tr
      className="border-b border-neutral-200 hover:bg-neutral-50/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Checkbox */}
      <td className="px-2 py-1.5">
        <div onClick={(e) => e.stopPropagation()}>
          <div onClick={onSelect}>
            <CheckboxIcon checked={isSelected} />
          </div>
        </div>
      </td>

      {/* Employee Name with Avatar */}
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          {employee.isVacant ? (
            <UnassignedAvatar />
          ) : employee.avatar ? (
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-500">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          )}
          <span
            className={`text-sm font-medium ${employee.isVacant ? "text-neutral-500" : "text-neutral-900"
              }`}
          >
            {employee.isVacant ? "Unassigned" : employee.name}
          </span>
        </div>
      </td>

      {/* Work Phone */}
      <td className="px-2 py-1.5">
        <span className="text-sm font-medium text-neutral-500">
          {employee.workPhone || "—"}
        </span>
      </td>

      {/* Work Email */}
      <td className="px-2 py-1.5">
        <span className="text-sm font-medium text-neutral-400">
          {employee.workEmail || "—"}
        </span>
      </td>

      {/* Job Position */}
      <td className="px-2 py-1.5">
        <span className="text-sm font-medium text-black">{employee.jobPosition}</span>
      </td>

      {/* Manager */}
      <td className="px-2 py-1.5">
        {employee.manager ? (
          <div className="flex items-center gap-2">
            {employee.manager.avatar ? (
              <img
                src={employee.manager.avatar}
                alt={employee.manager.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="text-xs font-medium text-neutral-500">
                  {employee.manager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-neutral-900">
              {employee.manager.name}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-neutral-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ========== MAIN COMPONENT ==========
export default function PositionListView({
  departments,
  onEmployeeClick,
  selectedEmployees = [],
  onSelectionChange,
}: PositionListViewProps) {
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(
    departments.map((d) => d.id)
  );

  const toggleDepartment = (id: string) => {
    setExpandedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSelectionChange = (ids: string[]) => {
    onSelectionChange?.(ids);
  };

  return (
    <div className="w-full bg-white overflow-hidden">
      {/* Table */}
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-neutral-50 border border-neutral-200">
            <th className="px-2 py-1.5 text-left w-[40px]">
              <CheckboxIcon checked={false} />
            </th>
            <th className="px-2 py-1.5 text-left min-w-[140px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Employee Name</span>
            </th>
            <th className="px-2 py-1.5 text-left min-w-[100px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Work Phone</span>
            </th>
            <th className="px-2 py-1.5 text-left min-w-[140px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Work Email</span>
            </th>
            <th className="px-2 py-1.5 text-left min-w-[110px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Job Position</span>
            </th>
            <th className="px-2 py-1.5 text-left min-w-[120px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Manager</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {departments.map((department) => (
            <DepartmentRow
              key={department.id}
              department={department}
              isExpanded={expandedDepartments.includes(department.id)}
              onToggle={() => toggleDepartment(department.id)}
              selectedEmployees={selectedEmployees}
              onSelectionChange={handleSelectionChange}
              onEmployeeClick={onEmployeeClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
