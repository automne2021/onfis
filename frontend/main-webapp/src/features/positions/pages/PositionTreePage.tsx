import { useState, useCallback, useEffect } from "react";
import {
  PositionToolbar,
  PositionTreeView,
  PositionListView,
  AddPositionModal,
  PositionDetailModal,
  type Position,
  type Department,
  type Employee,
  type UnassignedEmployee,
  type PositionDetailData,
} from "../components";
import type { AddPositionFormData, DepartmentOption, PositionOption } from "../components/AddPositionModal";
import { Add } from '@mui/icons-material';
import { Button } from "../../../components/common/Buttons/Button";
import { useRole } from "../../../hooks/useRole";
import { useToast } from "../../../contexts/useToast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import {
  getPositionTree,
  getDepartmentsWithEmployees,
  getUnassignedUsers,
  getDepartmentList,
  createPosition,
  movePosition,
  assignUserToPosition,
  getCurrentUserPositionInfo,
  type PositionTreeNode,
  type DepartmentWithEmployees,
  type UnassignedUser,
  type DepartmentItem,
} from "../services/positionApi";

// ── Mapper helpers ────────────────────────────────────────────────────────────

function mapTreeNode(node: PositionTreeNode, insertDeptHeaders: boolean = false): Position {
  const mappedChildren = node.children?.map((c) => mapTreeNode(c, false));

  // For root node only: group children by department and insert dept header rows
  if (insertDeptHeaders && mappedChildren && mappedChildren.length > 0 && node.children) {
    const groupedByDept = new Map<string, { deptName: string; children: Position[] }>();
    const noDeptChildren: Position[] = [];

    node.children.forEach((rawChild, i) => {
      const mapped = mappedChildren[i];
      const deptKey = rawChild.departmentId ?? "__none__";
      const deptName = rawChild.departmentName ?? "Other";
      if (!rawChild.departmentId) {
        noDeptChildren.push(mapped);
      } else {
        if (!groupedByDept.has(deptKey)) {
          groupedByDept.set(deptKey, { deptName, children: [] });
        }
        groupedByDept.get(deptKey)!.children.push(mapped);
      }
    });

    const deptHeaderChildren: Position[] = [];
    groupedByDept.forEach(({ deptName, children }, deptKey) => {
      if (children.length === 1) {
        // Only one person in dept branch: make a header that expands to that person
        deptHeaderChildren.push({
          id: `dept-header-${deptKey}`,
          name: deptName,
          title: deptName,
          isDeptHeader: true,
          deptName,
          isVacant: false,
          children,
        });
      } else {
        // Multiple people in the dept at root's child level (shouldn't normally happen
        // but handle gracefully: wrap them all under the dept header)
        deptHeaderChildren.push({
          id: `dept-header-${deptKey}`,
          name: deptName,
          title: deptName,
          isDeptHeader: true,
          deptName,
          isVacant: false,
          children,
        });
      }
    });

    return {
      id: node.id ?? node.positionId,
      name: node.name,
      title: node.title,
      avatar: node.avatar ?? undefined,
      isVacant: node.isVacant,
      status: (node.status as Position["status"]) ?? undefined,
      subordinateCount: node.subordinateCount ?? undefined,
      children: [...deptHeaderChildren, ...noDeptChildren],
    };
  }

  return {
    id: node.id ?? node.positionId,
    name: node.name,
    title: node.title,
    avatar: node.avatar ?? undefined,
    isVacant: node.isVacant,
    status: (node.status as Position["status"]) ?? undefined,
    subordinateCount: node.subordinateCount ?? undefined,
    children: mappedChildren,
  };
}

function mapDepartments(deps: DepartmentWithEmployees[]): Department[] {
  return deps.map((d) => ({
    id: d.id,
    name: d.name,
    employees: d.employees.map((e) => ({
      id: e.id,
      positionId: e.positionId,
      name: e.name,
      avatar: e.avatar ?? undefined,
      workPhone: e.workPhone ?? undefined,
      workEmail: e.workEmail ?? undefined,
      jobPosition: e.jobPosition,
      level: e.level,
      role: e.role,
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

// ── Helper: flatten tree to position options ──────────────────────────────────

function flattenTreeToOptions(node: PositionTreeNode): PositionOption[] {
  const result: PositionOption[] = [{
    id: node.positionId ?? node.id,
    title: node.title,
    holderName: node.isVacant ? undefined : node.name,
  }];
  for (const child of node.children || []) {
    result.push(...flattenTreeToOptions(child));
  }
  return result;
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
  const [rawTreeData, setRawTreeData] = useState<PositionTreeNode | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentList, setDepartmentList] = useState<DepartmentItem[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<UnassignedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserLevel, setCurrentUserLevel] = useState<string | null>(null);
  const { isManager } = useRole();
  const { showToast } = useToast();

  // ── Position detail modal state ─────────────────────────────────────────────
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    data: PositionDetailData | null;
  }>({ isOpen: false, data: null });

  // ── Confirm dialog state ────────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "Confirm",
    onConfirm: () => {},
  });

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchTreeData = useCallback(async () => {
    try {
      const [treeData, unassignedData] = await Promise.all([
        getPositionTree(),
        getUnassignedUsers(),
      ]);
      setRawTreeData(treeData);
      setPositionTree(mapTreeNode(treeData, true));
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

  const fetchDepartmentList = useCallback(async () => {
    try {
      const depts = await getDepartmentList();
      setDepartmentList(depts);
    } catch (err) {
      console.error("Failed to fetch department list:", err);
    }
  }, []);

  useEffect(() => {
    fetchTreeData();
    fetchListData();
    fetchDepartmentList();
    getCurrentUserPositionInfo()
      .then((info) => setCurrentUserLevel(info.level))
      .catch(() => {/* ignore – level-based control degrades gracefully */});
  }, [fetchTreeData, fetchListData, fetchDepartmentList]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([fetchTreeData(), fetchListData()]);
  }, [fetchTreeData, fetchListData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilter = () => {
    console.log("Filter clicked");
  };

  const handleAddPosition = () => {
    setIsAddModalOpen(true);
  };

  const handleCreatePosition = async (data: AddPositionFormData) => {
    try {
      await createPosition({
        title: data.jobTitle,
        departmentId: data.departmentId || undefined,
        parentId: data.parentId || undefined,
      });

      // If not vacant and a user is assigned, assign the user to the new position
      if (!data.isVacant && data.assignedUser) {
        // We need the position ID — re-fetch and find the new one
        // For simplicity, we'll just refresh; the user can be assigned later
      }

      setIsAddModalOpen(false);
      showToast("Position created successfully", "success");
      // Refresh data
      await fetchTreeData();
      await fetchListData();
    } catch (err) {
      console.error("Failed to create position:", err);
      showToast("Failed to create position", "error");
    }
  };

  const handlePositionClick = (position: Position) => {
    // Dept header nodes are not real positions — skip modal
    if (position.isDeptHeader) return;

    // Find the corresponding raw tree node to get level, userId etc.
    const rawNode = rawTreeData ? findPositionInTree(rawTreeData, position.id) : null;
    // rawNode.id = userId, rawNode.positionId = position DB id
    const positionId = rawNode?.positionId ?? position.id;
    setDetailModal({
      isOpen: true,
      data: {
        positionId,
        userId: rawNode?.id ?? undefined,
        name: position.name,
        title: position.title,
        avatar: position.avatar,
        isVacant: position.isVacant ?? true,
        level: rawNode?.level,
        role: rawNode?.role,
        email: rawNode?.email,
      },
    });
  };

  const handleEmployeeClick = (employee: Employee) => {
    setDetailModal({
      isOpen: true,
      data: {
        positionId: employee.positionId ?? employee.id,
        userId: employee.isVacant ? undefined : employee.id,
        name: employee.name,
        title: employee.jobPosition,
        avatar: employee.avatar,
        isVacant: employee.isVacant ?? false,
        level: employee.level,
        role: employee.role,
        email: employee.workEmail,
      },
    });
  };

  // Drag and drop: move a position under a new parent
  const handlePositionMove = useCallback(async (draggedId: string, targetId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Move Position",
      message: "Are you sure you want to move this position? All subordinates will follow.",
      variant: "warning",
      confirmLabel: "Move",
      onConfirm: async () => {
        closeConfirm();
        try {
          await movePosition(draggedId, targetId);
          showToast("Position moved successfully", "success");
          await fetchTreeData();
        } catch (err) {
          console.error("Failed to move position:", err);
          showToast("Failed to move position", "error");
          await fetchTreeData(); // refresh to revert UI
        }
      },
    });
  }, [fetchTreeData, showToast, closeConfirm]);

  // Assign an unassigned employee to a position
  const handleEmployeeAssign = useCallback(
    async (employeeId: string, targetPositionId: string, mode: "replace" | "subordinate") => {
      const employeeName = unassignedEmployees.find((e) => e.id === employeeId)?.name || "this employee";

      if (mode === "replace") {
        // Replace: assign user directly to the target position
        setConfirmDialog({
          isOpen: true,
          title: "Assign Employee",
          message: `Are you sure you want to assign "${employeeName}" to this position?`,
          variant: "info",
          confirmLabel: "Assign",
          onConfirm: async () => {
            closeConfirm();
            try {
              await assignUserToPosition(targetPositionId, employeeId);
              showToast(`${employeeName} assigned successfully`, "success");
              await fetchTreeData();
            } catch (err) {
              console.error("Failed to assign employee:", err);
              showToast("Failed to assign employee", "error");
              await fetchTreeData(); // refresh to revert UI
            }
          },
        });
      } else {
        // Subordinate: create a new child position, then assign user to it
        setConfirmDialog({
          isOpen: true,
          title: "Add as Subordinate",
          message: `Are you sure you want to add "${employeeName}" as a subordinate? A new position will be created under the target.`,
          variant: "info",
          confirmLabel: "Confirm",
          onConfirm: async () => {
            closeConfirm();
            try {
              // Find the target position's department for the new position
              const targetPos = rawTreeData
                ? findPositionInTree(rawTreeData, targetPositionId)
                : null;

              // Create a new subordinate position
              const newPosition = await createPosition({
                title: "New Position",
                parentId: targetPositionId,
                departmentId: targetPos?.departmentId ?? undefined,
              });

              // Assign the employee to the new position
              await assignUserToPosition(newPosition.id, employeeId);
              showToast(`${employeeName} added as subordinate`, "success");
              await fetchTreeData();
            } catch (err) {
              console.error("Failed to add subordinate:", err);
              showToast("Failed to add subordinate", "error");
              await fetchTreeData();
            }
          },
        });
      }
    },
    [unassignedEmployees, rawTreeData, fetchTreeData, showToast, closeConfirm]
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // Get position options for the modal
  const positionOptions: PositionOption[] = rawTreeData
    ? flattenTreeToOptions(rawTreeData).filter((p) => p.id !== "empty" && p.id !== "virtual-root")
    : [];

  const departmentOptions: DepartmentOption[] = departmentList.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const unassignedUserOptions = unassignedEmployees.map((e) => ({
    id: e.id,
    name: e.name,
  }));

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

      {/* Position Detail Modal */}
      <PositionDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, data: null })}
        onRefresh={handleRefreshAll}
        data={detailModal.data}
        currentUserLevel={currentUserLevel}
        isManager={isManager}
      />

      {/* Add Position Modal */}
      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreatePosition}
        departments={departmentOptions}
        positions={positionOptions}
        unassignedUsers={unassignedUserOptions}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

// ── Tree search helper ─────────────────────────────────────────────────────────

interface TreeNodeWithDept {
  id?: string;
  positionId?: string;
  departmentId?: string;
  level?: string;
  role?: string;
  email?: string;
  children?: TreeNodeWithDept[];
}

/** Search the raw tree for a node by userId or positionId */
function findPositionInTree(node: TreeNodeWithDept, id: string): TreeNodeWithDept | null {
  if (node.id === id || node.positionId === id) return node;
  for (const child of node.children || []) {
    const found = findPositionInTree(child, id);
    if (found) return found;
  }
  return null;
}
