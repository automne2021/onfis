import { useState, useCallback, useEffect, useMemo } from "react";
import { PositionToolbar, PositionTreeView, PositionListView, AddPositionModal, PositionDetailModal, type Position, type Department, type Employee, type UnassignedEmployee, type PositionDetailData } from "../components";
import type { AddPositionFormData, DepartmentOption, PositionOption } from "../components/AddPositionModal";
import type { ActiveFilters } from "../../../components/common/FilterDropdown";
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
  removeUnassignedUser,
  getCurrentUserPositionInfo,
  type PositionTreeNode,
  type DepartmentWithEmployees,
  type UnassignedUser,
  type DepartmentItem,
} from "../services/positionApi";

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
      departmentName: d.name,
    })),
  }));
}

function mapUnassigned(users: UnassignedUser[]): UnassignedEmployee[] {
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar ?? undefined,
    role: u.role ?? undefined,
    email: u.email ?? undefined,
  }));
}

function countPositions(tree: Position): { total: number; vacant: number } {
  const isDeptHeader = tree.isDeptHeader;
  let total = (!isDeptHeader && !tree.isVacant) ? 1 : 0;
  let vacant = (!isDeptHeader && tree.isVacant) ? 1 : 0;
  for (const child of tree.children || []) {
    const childCount = countPositions(child);
    total += childCount.total;
    vacant += childCount.vacant;
  }
  return { total, vacant };
}

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

function filterPositionTree(node: Position, query: string, deptIds: string[]): Position {
  const q = query.trim().toLowerCase();
  const hasDeptFilter = deptIds.length > 0;
  const hasTextFilter = q.length > 0;

  if (!hasDeptFilter && !hasTextFilter) return node;

  const filteredChildren = (node.children ?? []).reduce<Position[]>((acc, child) => {
    // Dept header: apply department filter
    if (child.isDeptHeader) {
      if (hasDeptFilter) {
        const deptId = child.id.replace("dept-header-", "");
        if (!deptIds.includes(deptId)) return acc; // filtered out
      }
      if (!hasTextFilter) {
        acc.push(child);
        return acc;
      }
      // Text filter: keep dept header only if any child matches
      const filteredKids = (child.children ?? []).filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.children ?? []).some((gc) => gc.name.toLowerCase().includes(q) || gc.title.toLowerCase().includes(q))
      );
      if (filteredKids.length > 0) {
        acc.push({ ...child, children: filteredKids });
      }
      return acc;
    }

    // Regular node: match name or title
    if (hasTextFilter) {
      const matches =
        child.name.toLowerCase().includes(q) || child.title.toLowerCase().includes(q);
      if (!matches) {
        // Check descendants
        const filteredSub = filterPositionTree(child, query, []);
        if ((filteredSub.children ?? []).length > 0) {
          acc.push(filteredSub);
        }
        return acc;
      }
    }
    acc.push(child);
    return acc;
  }, []);

  return { ...node, children: filteredChildren };
}

// Fallback mock data (shown only while loading or on error)
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
  const [toolbarFilters, setToolbarFilters] = useState<ActiveFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserLevel, setCurrentUserLevel] = useState<string | null>(null);
  const { isManagerLike, isAdmin } = useRole();
  const canManagePositions = isManagerLike || isAdmin;
  const { showToast } = useToast();

  // Position detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    data: PositionDetailData | null;
  }>({ isOpen: false, data: null });

  // Confirm dialog state
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

  // Displaced user dialog state (assign to occupied position)
  const [displacedDialog, setDisplacedDialog] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    targetPositionId: string;
    currentUserName: string;
  }>({ isOpen: false, employeeId: "", employeeName: "", targetPositionId: "", currentUserName: "" });

  // Fetch data

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
      .catch(() => {/* ignore — level-based control degrades gracefully */});
  }, [fetchTreeData, fetchListData, fetchDepartmentList]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([fetchTreeData(), fetchListData()]);
  }, [fetchTreeData, fetchListData]);

  const handleDisplacedAction = useCallback(async (action: "unassign" | "remove") => {
    const { employeeId, employeeName, targetPositionId } = displacedDialog;
    setDisplacedDialog((prev) => ({ ...prev, isOpen: false }));
    try {
      await assignUserToPosition(targetPositionId, employeeId, action);
      showToast(`${employeeName} assigned successfully`, "success");
      await fetchTreeData();
    } catch (err) {
      console.error("Failed to assign employee:", err);
      showToast("Failed to assign employee", "error");
      await fetchTreeData();
    }
  }, [displacedDialog, fetchTreeData, showToast]);

  // Handlers

  const handleFilter = useCallback((filters: ActiveFilters) => {
    setToolbarFilters(filters);
  }, []);

  const handleAddPosition = () => {
    setIsAddModalOpen(true);
  };

  const handleCreatePosition = async (data: AddPositionFormData) => {
    try {
      const newPosition = await createPosition({
        title: data.jobTitle,
        departmentId: data.departmentId || undefined,
        parentId: data.parentId || undefined,
      });

      // If not vacant and a user is selected, assign them to the new position
      if (!data.isVacant && data.assignedUser) {
        await assignUserToPosition(newPosition.id, data.assignedUser);
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
    // Dept header nodes are not real positions ΓÇö skip modal
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
        departmentName: rawNode?.departmentName,
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
        departmentName: employee.departmentName,
      },
    });
  };

  // Drag and drop: move a position under a new parent
  const handlePositionMove = useCallback(async (draggedId: string, targetId: string) => {
    // Resolve userId → positionId (since mapped node IDs are userIds)
    const draggedRawNode = rawTreeData ? findPositionInTree(rawTreeData, draggedId) : null;
    const resolvedDraggedId = draggedRawNode?.positionId ?? draggedId;
    const targetRawNode = rawTreeData ? findPositionInTree(rawTreeData, targetId) : null;
    const resolvedTargetId = targetRawNode?.positionId ?? targetId;

    setConfirmDialog({
      isOpen: true,
      title: "Move Position",
      message: "Are you sure you want to move this position? All subordinates will follow.",
      variant: "warning",
      confirmLabel: "Move",
      onConfirm: async () => {
        closeConfirm();
        try {
          await movePosition(resolvedDraggedId, resolvedTargetId);
          showToast("Position moved successfully", "success");
          await fetchTreeData();
        } catch (err) {
          console.error("Failed to move position:", err);
          showToast("Failed to move position", "error");
          await fetchTreeData(); // refresh to revert UI
        }
      },
    });
  }, [rawTreeData, fetchTreeData, showToast, closeConfirm]);

  // Assign an unassigned employee to a position
  const handleEmployeeAssign = useCallback(
    async (employeeId: string, targetPositionId: string, mode: "replace" | "subordinate") => {
      const employeeName = unassignedEmployees.find((e) => e.id === employeeId)?.name || "this employee";

      // Resolve userId → positionId (since mapped node IDs are userIds)
      const targetRawNode = rawTreeData ? findPositionInTree(rawTreeData, targetPositionId) : null;
      const resolvedPositionId = targetRawNode?.positionId ?? targetPositionId;

      if (mode === "replace") {
        // Check if the target position is already occupied
        const isOccupied = targetRawNode && !targetRawNode.isVacant && targetRawNode.id;
        const currentOccupantName = isOccupied ? (targetRawNode?.name ?? "current occupant") : null;

        if (isOccupied) {
          // Show 3-choice dialog: unassign / remove / cancel
          setDisplacedDialog({
            isOpen: true,
            employeeId,
            employeeName,
            targetPositionId: resolvedPositionId,
            currentUserName: currentOccupantName!,
          });
        } else {
          // Vacant position: simple confirm
          setConfirmDialog({
            isOpen: true,
            title: "Assign Employee",
            message: `Are you sure you want to assign "${employeeName}" to this position?`,
            variant: "info",
            confirmLabel: "Assign",
            onConfirm: async () => {
              closeConfirm();
              try {
                await assignUserToPosition(resolvedPositionId, employeeId);
                showToast(`${employeeName} assigned successfully`, "success");
                await fetchTreeData();
              } catch (err) {
                console.error("Failed to assign employee:", err);
                showToast("Failed to assign employee", "error");
                await fetchTreeData();
              }
            },
          });
        }
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
              // Create a new subordinate position
              const newPosition = await createPosition({
                title: "New Position",
                parentId: resolvedPositionId,
                departmentId: targetRawNode?.departmentId ?? undefined,
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

  const handleRemoveUnassignedUser = useCallback((employeeId: string) => {
    const employeeName = unassignedEmployees.find((e) => e.id === employeeId)?.name || "this person";
    setConfirmDialog({
      isOpen: true,
      title: "Remove from Organization",
      message: `Remove "${employeeName}" from the organization? They will no longer appear in any lists.`,
      variant: "danger",
      confirmLabel: "Remove",
      onConfirm: async () => {
        closeConfirm();
        try {
          await removeUnassignedUser(employeeId);
          showToast(`${employeeName} removed`, "success");
          await fetchTreeData();
        } catch (err) {
          console.error("Failed to remove user:", err);
          showToast("Failed to remove user", "error");
        }
      },
    });
  }, [unassignedEmployees, fetchTreeData, showToast, closeConfirm]);

  // Get position options for the modal
  const positionOptions: PositionOption[] = rawTreeData
    ? (() => {
        const seen = new Set<string>();
        return flattenTreeToOptions(rawTreeData)
          .filter((p) => p.id !== "empty" && p.id !== "virtual-root")
          .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
      })()
    : [];

  const departmentOptions: DepartmentOption[] = departmentList.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const unassignedUserOptions = unassignedEmployees.map((e) => ({
    id: e.id,
    name: e.name,
  }));

  // Filter list-view departments by active filters + search query
  const filteredDepartments = useMemo(() => {
    const selectedDeptIds = toolbarFilters.department;
    let filtered = departments;

    if (selectedDeptIds && selectedDeptIds.length > 0) {
      filtered = filtered.filter((d) => selectedDeptIds.includes(d.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.reduce<Department[]>((acc, dept) => {
        const matchedEmps = dept.employees.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.jobPosition.toLowerCase().includes(q) ||
            (e.workEmail?.toLowerCase().includes(q) ?? false) ||
            (e.workPhone?.toLowerCase().includes(q) ?? false)
        );
        if (matchedEmps.length > 0) {
          acc.push({ ...dept, employees: matchedEmps });
        } else if (dept.name.toLowerCase().includes(q)) {
          acc.push(dept);
        }
        return acc;
      }, []);
    }

    return filtered;
  }, [departments, toolbarFilters, searchQuery]);

  // Filter tree view by active department/search filters
  const filteredPositionTree = useMemo(() => {
    const deptIds = toolbarFilters.department ?? [];
    return filterPositionTree(positionTree, searchQuery, deptIds);
  }, [positionTree, searchQuery, toolbarFilters]);

  const treeSearchActive = searchQuery.trim().length > 0 || (toolbarFilters.department ?? []).length > 0;

  const { total: totalPositions, vacant: vacantPositions } = countPositions(positionTree);

  if (loading) {
    return (
      <div className="relative w-full mx-auto animate-pulse">
        {/* Toolbar skeleton */}
        <div className="mb-2 navbar-style">
          <div className="h-4 w-24 bg-neutral-200 rounded" />
          <div className="flex-1 h-9 bg-neutral-100 rounded-xl max-w-xs" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-neutral-100 rounded-xl" />
            <div className="h-9 w-20 bg-neutral-100 rounded-xl" />
          </div>
        </div>

        {/* Stats bar + button skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div className="bg-white border border-neutral-200 rounded-[8px] px-3 py-1.5 flex items-center gap-4">
            <div className="h-4 w-36 bg-neutral-200 rounded" />
            <div className="h-4 w-24 bg-neutral-200 rounded" />
          </div>
          <div className="h-9 w-32 bg-neutral-200 rounded-xl" />
        </div>

        {/* Tree node skeletons */}
        <div className="flex flex-col gap-2">
          {/* Level 0 ΓÇö root node */}
          <div className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl w-56">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3 bg-neutral-200 rounded w-3/4" />
              <div className="h-2.5 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>

          {/* Level 1 */}
          <div className="pl-10 flex flex-col gap-2">
            {[0.85, 0.7, 0.9].map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl" style={{ width: `${w * 220}px` }}>
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 bg-neutral-200 rounded w-3/4" />
                  <div className="h-2.5 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}

            {/* Level 2 */}
            <div className="pl-10 flex flex-col gap-2">
              {[0.75, 0.8].map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl" style={{ width: `${w * 200}px` }}>
                  <div className="w-6 h-6 rounded-full bg-neutral-100 flex-shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                    <div className="h-2.5 bg-neutral-100 rounded w-5/12" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Another level-1 branch */}
          <div className="pl-10 flex flex-col gap-2">
            {[0.8, 0.65].map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl" style={{ width: `${w * 220}px` }}>
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 bg-neutral-200 rounded w-3/4" />
                  <div className="h-2.5 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          departments={departmentList}
          activeFilters={toolbarFilters}
          onSearchQueryChange={setSearchQuery}
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
                Employees:{" "}
                <span className="text-primary font-bold">{totalPositions}</span>
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Vacant:{" "}
                <span className="text-status-off_track font-bold">{vacantPositions}</span>
              </span>
            </div>

            {/* Add Position Button */}
            {canManagePositions && (
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
            positions={filteredPositionTree}
            onPositionClick={handlePositionClick}
            onPositionMove={canManagePositions ? handlePositionMove : undefined}
            unassignedEmployees={canManagePositions ? unassignedEmployees : []}
            onEmployeeAssign={canManagePositions ? handleEmployeeAssign : undefined}
            onEmployeeRemove={canManagePositions ? handleRemoveUnassignedUser : undefined}
            searchActive={treeSearchActive}
          />
        </div>
      ) : (
        // List View Layout
        <div className="w-full bg-white rounded-[12px] overflow-hidden">
          <div className="bg-neutral-50 border border-neutral-200 flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-neutral-500">
                Employees:{" "}
                <span className="text-primary">{totalPositions}</span>
              </span>
              <span className="text-sm font-bold text-neutral-500">
                Vacant:{" "}
                <span className="text-status-off_track">{vacantPositions}</span>
              </span>
            </div>
            {canManagePositions && (
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
            departments={filteredDepartments}
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
        isManager={canManagePositions}
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

      {/* Displaced User Dialog (assign to occupied position) */}
      {displacedDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDisplacedDialog((p) => ({ ...p, isOpen: false }))} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-[420px] border border-neutral-200 overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-amber-50">
                <span className="material-symbols-rounded text-amber-500" style={{ fontSize: 28 }}>swap_horiz</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Position Already Occupied</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This position is currently held by <span className="font-semibold text-neutral-700">{displacedDialog.currentUserName}</span>.
                What would you like to do with them when assigning <span className="font-semibold text-neutral-700">{displacedDialog.employeeName}</span>?
              </p>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6 pt-1">
              <button
                onClick={() => handleDisplacedAction("unassign")}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Move {displacedDialog.currentUserName} to Unassigned List
              </button>
              <button
                onClick={() => handleDisplacedAction("remove")}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Remove {displacedDialog.currentUserName} from Organization
              </button>
              <button
                onClick={() => setDisplacedDialog((p) => ({ ...p, isOpen: false }))}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TreeNodeWithDept {
  id?: string;
  positionId?: string;
  departmentId?: string;
  departmentName?: string;
  name?: string;
  isVacant?: boolean;
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
