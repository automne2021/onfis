import { useState, useCallback } from "react";
import {
  PositionToolbar,
  PositionTreeView,
  PositionListView,
  AddPositionModal,
  type Position,
  type Department,
  type Employee,
  type UnassignedEmployee,
} from "../components";
import { Add } from '@mui/icons-material';
import { Button } from "../../../components/common/Buttons/Button";
import { useRole } from "../../../hooks/useRole";

// Mock unassigned employees (new hires waiting to be placed)
const initialUnassignedEmployees: UnassignedEmployee[] = [
  { id: "new-1", name: "Alex Rivera", role: "Software Engineer" },
  { id: "new-2", name: "Priya Patel", role: "Product Designer" },
  { id: "new-3", name: "Marcus Chang", role: "Data Analyst" },
  { id: "new-4", name: "Elena Volkov", role: "Marketing Specialist" },
  { id: "new-5", name: "Jamal Thompson", role: "DevOps Engineer" },
];

// Richer mock data for Tree View - realistic org chart
const initialPositionTree: Position = {
  id: "ceo",
  name: "Sarah Johnson",
  title: "Chief Executive Officer",
  status: "primary",
  subordinateCount: 5,
  children: [
    {
      id: "cto",
      name: "Michael Chen",
      title: "Chief Technology Officer",
      status: "on_track",
      children: [
        {
          id: "dev-lead",
          name: "Emily Davis",
          title: "Development Lead",
          status: "on_track",
          children: [
            {
              id: "fe-dev",
              name: "James Wilson",
              title: "Frontend Developer",
              status: "on_track",
            },
            {
              id: "be-dev",
              name: "Lisa Park",
              title: "Backend Developer",
              status: "on_track",
            },
            {
              id: "vacant-dev",
              name: "Vacant",
              title: "Full-stack Developer",
              isVacant: true,
            },
          ],
        },
        {
          id: "qa-lead",
          name: "David Brown",
          title: "QA Engineer",
          status: "off_track",
        },
      ],
    },
    {
      id: "cfo",
      name: "Robert Taylor",
      title: "Chief Financial Officer",
      status: "on_track",
      children: [
        {
          id: "accountant",
          name: "Jennifer Lee",
          title: "Senior Accountant",
          status: "on_track",
        },
        {
          id: "vacant-finance",
          name: "Vacant",
          title: "Financial Analyst",
          isVacant: true,
        },
      ],
    },
    {
      id: "cmo",
      name: "Amanda White",
      title: "Chief Marketing Officer",
      status: "on_track",
      children: [
        {
          id: "mkt-lead",
          name: "Chris Martinez",
          title: "Marketing Lead",
          status: "on_track",
        },
        {
          id: "designer",
          name: "Sophia Kim",
          title: "UI/UX Designer",
          status: "on_track",
        },
      ],
    },
  ],
};

// Mock data for List View
const mockDepartments: Department[] = [
  {
    id: "marketing",
    name: "Marketing",
    employees: [
      {
        id: "emp-1",
        name: "John Nguyen",
        workPhone: "0987654321",
        workEmail: "john.nguyen@gmail.com",
        jobPosition: "Manager",
        manager: { id: "mgr-1", name: "Alex Nguyen" },
      },
      {
        id: "emp-2",
        name: "Unassigned",
        jobPosition: "Marketing Design",
        isVacant: true,
        manager: { id: "mgr-1", name: "Alex Nguyen" },
      },
    ],
  },
  {
    id: "it",
    name: "IT",
    employees: [
      {
        id: "emp-3",
        name: "Sarah Chen",
        workPhone: "0912345678",
        workEmail: "sarah.chen@gmail.com",
        jobPosition: "Senior Developer",
        manager: { id: "mgr-2", name: "Mike Wilson" },
      },
      {
        id: "emp-4",
        name: "Tom Brown",
        workPhone: "0923456789",
        workEmail: "tom.brown@gmail.com",
        jobPosition: "Junior Developer",
        manager: { id: "mgr-2", name: "Mike Wilson" },
      },
    ],
  },
];

// Helper: recursively find and remove a node from the tree
function removeNode(tree: Position, id: string): { tree: Position; removed: Position | null } {
  if (tree.id === id) return { tree, removed: null }; // can't remove root

  const newChildren: Position[] = [];
  let removed: Position | null = null;

  for (const child of tree.children || []) {
    if (child.id === id) {
      removed = child;
    } else {
      const result = removeNode(child, id);
      if (result.removed) removed = result.removed;
      newChildren.push(result.removed ? result.tree : child);
    }
  }

  return {
    tree: { ...tree, children: newChildren.length > 0 ? newChildren : undefined },
    removed,
  };
}

// Helper: recursively insert a node as child of target
function insertNode(tree: Position, targetId: string, node: Position): Position {
  if (tree.id === targetId) {
    return {
      ...tree,
      children: [...(tree.children || []), node],
    };
  }

  return {
    ...tree,
    children: tree.children?.map((child) => insertNode(child, targetId, node)),
  };
}

// Helper: count all positions recursively
function countPositions(tree: Position): { total: number; vacant: number } {
  let total = 1;
  let vacant = tree.isVacant ? 1 : 0;
  for (const child of tree.children || []) {
    const childCount = countPositions(child);
    total += childCount.total;
    vacant += childCount.vacant;
  }
  return { total, vacant };
}

export default function PositionTreePage() {
  // const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [positionTree, setPositionTree] = useState<Position>(initialPositionTree);
  const [unassignedEmployees, setUnassignedEmployees] = useState<UnassignedEmployee[]>(initialUnassignedEmployees);
  const { isManager } = useRole();

  const handleFilter = () => {
    console.log("Filter clicked");
  };

  const handleAddPosition = () => {
    setIsAddModalOpen(true);
  };

  const handleCreatePosition = (data: {
    jobTitle: string;
    department: string;
    reportsTo: string;
    employmentType: "full-time" | "part-time" | "contract";
    isVacant: boolean;
    assignedUser: string;
  }) => {
    console.log("Creating position:", data);
    setIsAddModalOpen(false);
  };

  const handlePositionClick = (position: Position) => {
    console.log("Position clicked:", position);
  };

  const handleEmployeeClick = (employee: Employee) => {
    console.log("Employee clicked:", employee);
  };

  // Drag and drop: move a position under a new parent
  const handlePositionMove = useCallback((draggedId: string, targetId: string) => {
    setPositionTree((prev) => {
      const { tree: treeWithout, removed } = removeNode(prev, draggedId);
      if (!removed) return prev;
      return insertNode(treeWithout, targetId, removed);
    });
  }, []);

  // Assign an unassigned employee to a position
  const handleEmployeeAssign = useCallback((employeeId: string, targetPositionId: string) => {
    const employee = unassignedEmployees.find((e) => e.id === employeeId);
    if (!employee) return;

    // Update position tree: fill the target with the employee's name
    const fillPosition = (tree: Position): Position => {
      if (tree.id === targetPositionId) {
        return { ...tree, name: employee.name, isVacant: false, status: "on_track" };
      }
      return {
        ...tree,
        children: tree.children?.map(fillPosition),
      };
    };

    setPositionTree((prev) => fillPosition(prev));
    setUnassignedEmployees((prev) => prev.filter((e) => e.id !== employeeId));
  }, [unassignedEmployees]);

  const { total: totalPositions, vacant: vacantPositions } = countPositions(positionTree);

  return (
    <div className="relative w-full mx-auto">
      {/* Toolbar */}
      <div className="mb-2">
        <PositionToolbar
          // searchQuery={searchQuery}
          // onSearchChange={setSearchQuery}
          onFilter={handleFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Main Content Area */}
      {viewMode === "tree" ? (
        <div className="relative">
          {/* Stats and Add Button Row */}
          <div className="flex items-center justify-between mb-2">
            {/* Stats Box */}
            <div className="bg-white border border-primary rounded-[8px] px-3 py-1.5 flex items-center gap-4">
              <span className="text-xs font-semibold text-neutral-500">
                Total Position:{" "}
                <span className="text-primary font-bold">{totalPositions}</span>
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Vacant:{" "}
                <span className="text-status-off_track font-bold">{vacantPositions}</span>
              </span>
            </div>

            {/* Add Position Button */}
            {isManager && (
              <Button
                title="Add Position"
                iconLeft={<Add fontSize="small" />}
                onClick={handleAddPosition}
                style="primary"
                textStyle='body-4-medium'
              />
            )}
          </div>

          {/* Tree View */}
          <PositionTreeView
            positions={positionTree}
            onPositionClick={handlePositionClick}
            onPositionMove={handlePositionMove}
            unassignedEmployees={isManager ? unassignedEmployees : []}
            onEmployeeAssign={handleEmployeeAssign}
          />
        </div>
      ) : (
        // List View Layout
        <div className="w-full bg-white rounded-[12px] overflow-hidden">
          <div className="bg-neutral-50 border border-neutral-200 flex flex-wrap items-center gap-4 p-2">
            <span className="text-sm font-bold text-neutral-500">
              Total Position:{" "}
              <span className="text-primary">{totalPositions}</span>
            </span>
            <span className="text-sm font-bold text-neutral-500">
              Vacant:{" "}
              <span className="text-status-off_track">{vacantPositions}</span>
            </span>
            {isManager && (
              <Button
                title="Add Position"
                iconLeft={<Add fontSize="small" />}
                onClick={handleAddPosition}
                style="primary"
                textStyle='body-4-medium'
              />
            )}
          </div>

          <PositionListView
            departments={mockDepartments}
            onEmployeeClick={handleEmployeeClick}
            selectedEmployees={selectedEmployees}
            onSelectionChange={setSelectedEmployees}
          />
        </div>
      )}

      {/* Add Position Modal */}
      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreatePosition}
      />
    </div>
  );
}
