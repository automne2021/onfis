import { useState, useCallback, useEffect } from "react";
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
import {
  getPositionTree,
  getDepartmentsWithEmployees,
  getUnassignedUsers,
  createPosition,
  movePosition,
  assignUserToPosition,
  type PositionTreeNode,
  type DepartmentWithEmployees,
  type UnassignedUser,
} from "../services/positionApi";

// ── Mapper helpers ────────────────────────────────────────────────────────────

function mapTreeNode(node: PositionTreeNode): Position {
  return {
    id: node.id,
    name: node.name,
    title: node.title,
    avatar: node.avatar ?? undefined,
    isVacant: node.isVacant,
    status: (node.status as Position["status"]) ?? undefined,
    subordinateCount: node.subordinateCount ?? undefined,
    children: node.children?.map(mapTreeNode),
  };
}

function mapDepartments(deps: DepartmentWithEmployees[]): Department[] {
  return deps.map((d) => ({
    id: d.id,
    name: d.name,
    employees: d.employees.map((e) => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar ?? undefined,
      workPhone: e.workPhone ?? undefined,
      workEmail: e.workEmail ?? undefined,
      jobPosition: e.jobPosition,
      manager: e.manager
        ? { id: e.manager.id, name: e.manager.name, avatar: e.manager.avatar ?? undefined }
        : undefined,
      isVacant: e.isVacant,
    })),
  }));
}

function mapUnassigned(users: UnassignedUser[]): UnassignedEmployee[] {
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar ?? undefined,
    role: u.role ?? undefined,
  }));
}

// ── Helper: count all positions recursively ───────────────────────────────────

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

// ── Fallback mock data (shown only while loading or on error) ─────────────────

const fallbackTree: Position = {
  id: "loading",
  name: "Loading...",
  title: "Organization",
  status: "primary",
};

export default function PositionTreePage() {
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [positionTree, setPositionTree] = useState<Position>(fallbackTree);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<UnassignedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const { isManager } = useRole();

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchTreeData = useCallback(async () => {
    try {
      const [treeData, unassignedData] = await Promise.all([
        getPositionTree(),
        getUnassignedUsers(),
      ]);
      setPositionTree(mapTreeNode(treeData));
      setUnassignedEmployees(mapUnassigned(unassignedData));
    } catch (err) {
      console.error("Failed to fetch position tree:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListData = useCallback(async () => {
    try {
      const depsData = await getDepartmentsWithEmployees();
      setDepartments(mapDepartments(depsData));
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }, []);

  useEffect(() => {
    fetchTreeData();
    fetchListData();
  }, [fetchTreeData, fetchListData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilter = () => {
    console.log("Filter clicked");
  };

  const handleAddPosition = () => {
    setIsAddModalOpen(true);
  };

  const handleCreatePosition = async (data: {
    jobTitle: string;
    department: string;
    reportsTo: string;
    employmentType: "full-time" | "part-time" | "contract";
    isVacant: boolean;
    assignedUser: string;
  }) => {
    try {
      await createPosition({
        title: data.jobTitle,
        departmentId: data.department || undefined,
        parentId: data.reportsTo || undefined,
      });
      setIsAddModalOpen(false);
      // Refresh data
      await fetchTreeData();
      await fetchListData();
    } catch (err) {
      console.error("Failed to create position:", err);
    }
  };

  const handlePositionClick = (position: Position) => {
    console.log("Position clicked:", position);
  };

  const handleEmployeeClick = (employee: Employee) => {
    console.log("Employee clicked:", employee);
  };

  // Drag and drop: move a position under a new parent
  const handlePositionMove = useCallback(async (draggedId: string, targetId: string) => {
    try {
      await movePosition(draggedId, targetId);
      await fetchTreeData();
    } catch (err) {
      console.error("Failed to move position:", err);
    }
  }, [fetchTreeData]);

  // Assign an unassigned employee to a position
  const handleEmployeeAssign = useCallback(async (employeeId: string, targetPositionId: string) => {
    try {
      await assignUserToPosition(targetPositionId, employeeId);
      await fetchTreeData();
    } catch (err) {
      console.error("Failed to assign employee:", err);
    }
  }, [fetchTreeData]);

  const { total: totalPositions, vacant: vacantPositions } = countPositions(positionTree);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto">
      {/* Toolbar */}
      <div className="mb-2">
        <PositionToolbar
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
            departments={departments}
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
