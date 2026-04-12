import { useState, useCallback, useRef, useEffect, useMemo, type DragEvent } from "react";
import type { Position } from "./PositionCard";

// ===================== TYPES =====================
type DropMode = "replace" | "subordinate";

interface PositionTreeViewProps {
  positions: Position;
  onPositionMove?: (draggedId: string, targetId: string) => void;
  onPositionClick?: (position: Position) => void;
  unassignedEmployees?: UnassignedEmployee[];
  onEmployeeAssign?: (employeeId: string, targetPositionId: string, mode: DropMode) => void;
  onEmployeeRemove?: (employeeId: string) => void;
  /** When true (search/filter active), auto-expand all visible nodes */
  searchActive?: boolean;
}

export interface UnassignedEmployee {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

// ===================== ICONS =====================
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
  >
    <path d="M6 9L12 15L18 9" stroke="#62748E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);


const PanelToggleIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M15 3V21" stroke="currentColor" strokeWidth="2" />
    {open && <path d="M18 8L20 10L18 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    {!open && <path d="M20 8L18 10L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

// ===================== AVATAR =====================
const Avatar = ({
  name,
  avatar,
  size = 40,
  isVacant,
}: {
  name: string;
  avatar?: string;
  size?: number;
  isVacant?: boolean;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  ];
  const colorIndex = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  if (isVacant) {
    return (
      <div
        className="rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="#90A1B9" strokeWidth="2" />
          <path d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${colors[colorIndex]} rounded-full flex items-center justify-center shrink-0 text-white font-semibold border-2 border-white shadow-sm`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
};

// ===================== STATUS DOT =====================
const StatusDot = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    primary: "bg-primary",
    on_track: "bg-emerald-500",
    off_track: "bg-rose-500",
  };
  return <div className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-neutral-300"}`} />;
};

// ===================== HELPERS =====================

/** Count all visible (non-collapsed) nodes in the tree */
function countVisibleNodes(tree: Position, collapsedNodes: Set<string>): number {
  let count = 1;
  if (!collapsedNodes.has(tree.id) && tree.children) {
    for (const child of tree.children) {
      count += countVisibleNodes(child, collapsedNodes);
    }
  }
  return count;
}

/** Count employees (non-vacant positions) recursively in a subtree */
function countEmployeesInSubtree(node: Position): number {
  let count = (!node.isDeptHeader && node.isVacant === false) ? 1 : 0;
  for (const child of node.children ?? []) {
    count += countEmployeesInSubtree(child);
  }
  return count;
}

/** Calculate zoom scale based on visible node count */
function calculateZoomScale(visibleCount: number): number {
  if (visibleCount <= 1) return 1;
  if (visibleCount <= 3) return 1;
  if (visibleCount <= 5) return 0.95;
  if (visibleCount <= 8) return 0.85;
  if (visibleCount <= 12) return 0.75;
  if (visibleCount <= 18) return 0.65;
  if (visibleCount <= 25) return 0.55;
  return Math.max(0.4, 1 - visibleCount * 0.02);
}

// ===================== TREE LAYOUT =====================
const NODE_W = 200;
const ROOT_W = 250;
const DEPT_W = 220;
const H_GAP = 32;
const LEVEL_H = 120;
const STEM = 20;
const CARD_H_REG = 72;
const CARD_H_ROOT = 78;
const CARD_H_DEPT = 52;

interface LayoutEntry {
  position: Position;
  x: number;
  y: number;
  isRoot: boolean;
}

interface ConnectorLine {
  parentX: number;
  stemTopY: number;
  connectorY: number;
  childTopY: number;
  childXs: number[];
}

function computeLayout(root: Position, collapsedNodes: Set<string>) {
  const entries: LayoutEntry[] = [];
  const connectors: ConnectorLine[] = [];
  const widthCache = new Map<string, number>();

  function subtreeWidth(node: Position, level: number): number {
    if (widthCache.has(node.id)) return widthCache.get(node.id)!;
    const w = level === 0 ? ROOT_W : node.isDeptHeader ? DEPT_W : NODE_W;
    const children = node.children || [];
    if (children.length === 0 || collapsedNodes.has(node.id)) {
      widthCache.set(node.id, w);
      return w;
    }
    const childWidths = children.map((c) => subtreeWidth(c, level + 1));
    const total =
      childWidths.reduce((a, b) => a + b, 0) +
      (children.length - 1) * H_GAP;
    const result = Math.max(w, total);
    widthCache.set(node.id, result);
    return result;
  }

  function assign(
    node: Position,
    level: number,
    leftX: number,
    width: number,
  ) {
    const isRoot = level === 0;
    const cx = leftX + width / 2;
    const y = level * LEVEL_H;
    entries.push({ position: node, x: cx, y, isRoot });

    const children = node.children || [];
    if (children.length === 0 || collapsedNodes.has(node.id)) return;

    const childWidths = children.map((c) => subtreeWidth(c, level + 1));
    const totalChildW =
      childWidths.reduce((a, b) => a + b, 0) +
      (children.length - 1) * H_GAP;
    const cardH = isRoot ? CARD_H_ROOT : node.isDeptHeader ? CARD_H_DEPT : CARD_H_REG;
    const stemTopY = y + cardH;
    const connectorY = stemTopY + STEM;
    const childTopY = (level + 1) * LEVEL_H;

    const childXs: number[] = [];
    let curX = cx - totalChildW / 2;
    children.forEach((child, i) => {
      const cw = childWidths[i];
      childXs.push(curX + cw / 2);
      assign(child, level + 1, curX, cw);
      curX += cw + H_GAP;
    });

    connectors.push({
      parentX: cx,
      stemTopY,
      connectorY,
      childTopY,
      childXs,
    });
  }

  const totalWidth = subtreeWidth(root, 0);
  assign(root, 0, 0, totalWidth);

  const maxY =
    entries.length > 0 ? Math.max(...entries.map((e) => e.y)) : 0;
  const bottomCardH = entries.find((e) => e.y === maxY)?.isRoot
    ? CARD_H_ROOT
    : CARD_H_REG;
  const totalHeight = maxY + bottomCardH + 40;

  return { entries, connectors, totalWidth, totalHeight };
}

// ===================== TREE CONNECTORS (SVG) =====================
function TreeConnectors({
  connectors,
}: {
  connectors: ConnectorLine[];
}) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {connectors.map((c, i) => {
        const segs: string[] = [];
        // Vertical stem from parent card bottom
        segs.push(`M${c.parentX} ${c.stemTopY}L${c.parentX} ${c.connectorY}`);
        if (c.childXs.length === 1) {
          // Single child — straight vertical line
          segs.push(
            `M${c.childXs[0]} ${c.connectorY}L${c.childXs[0]} ${c.childTopY}`,
          );
        } else {
          // Horizontal bar between first and last child
          const minX = Math.min(...c.childXs);
          const maxX = Math.max(...c.childXs);
          segs.push(`M${minX} ${c.connectorY}L${maxX} ${c.connectorY}`);
          // Vertical drops to each child
          c.childXs.forEach((cx) =>
            segs.push(`M${cx} ${c.connectorY}L${cx} ${c.childTopY}`),
          );
        }
        return (
          <path
            key={i}
            d={segs.join(" ")}
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none"
            style={{ transition: "opacity 0.2s ease-in" }}
          />
        );
      })}
    </svg>
  );
}

// ===================== NODE CARD =====================
interface NodeCardProps {
  position: Position;
  isRoot: boolean;
  collapsedNodes: Set<string>;
  onToggle: (id: string) => void;
  draggedId: string | null;
  dragType: "position" | "employee" | null;
  onDragStart: (id: string, type: "position" | "employee") => void;
  onDragEnd: () => void;
  onDrop: (targetId: string, mode: DropMode) => void;
  onPositionClick?: (position: Position) => void;
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  style?: React.CSSProperties;
}

const NodeCard = ({
  position,
  isRoot,
  collapsedNodes,
  onToggle,
  draggedId,
  dragType,
  onDragStart,
  onDragEnd,
  onDrop,
  onPositionClick,
  nodeRefs,
  style,
}: NodeCardProps) => {
  const [dropZone, setDropZone] = useState<DropMode | null>(null);
  const children = position.children || [];
  const hasChildren = children.length > 0;
  const childCount = children.length;
  const isCollapsed = collapsedNodes.has(position.id);
  const isDragging = draggedId === position.id && dragType === "position";

  const statusBorderColors: Record<string, string> = {
    primary: "border-t-primary",
    on_track: "border-t-emerald-500",
    off_track: "border-t-rose-500",
  };
  const status = position.status || "on_track";

  const cardRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(position.id, el);
      else nodeRefs.current.delete(position.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [position.id],
  );

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", position.id);
    onDragStart(position.id, "position");
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== position.id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      setDropZone(e.clientY < midY ? "replace" : "subordinate");
    }
  };

  const handleDragLeave = () => setDropZone(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const mode = dropZone || "subordinate";
    setDropZone(null);
    if (draggedId && draggedId !== position.id) {
      onDrop(position.id, mode);
    }
  };

  const handleDragEnd = () => {
    setDropZone(null);
    onDragEnd();
  };

  const dropRingClass =
    dropZone === "replace"
      ? "ring-2 ring-amber-400 ring-offset-2"
      : dropZone === "subordinate"
        ? "ring-2 ring-emerald-400 ring-offset-2"
        : "";

  // ── Department header card ────────────────────────────────────
  if (position.isDeptHeader) {
    const employeeCount = countEmployeesInSubtree(position);
    return (
      <div style={style}>
        <div
          ref={cardRef}
          onClick={() => onPositionClick?.(position)}
          className={`
            relative cursor-pointer select-none
            transition-all duration-200
          `}
        >
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-neutral-100 transition-colors"
            style={{ width: DEPT_W }}>
            {/* Dept colour stripe */}
            <div className="w-1 h-6 rounded-full bg-primary/60 shrink-0" />
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wide truncate flex-1">
              {position.deptName ?? position.name}
            </span>
            {(hasChildren || employeeCount > 0) && (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                {employeeCount}
              </div>
            )}
          </div>
          {/* Expand/collapse toggle */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(position.id);
              }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10
                w-6 h-6 rounded-full bg-white border border-neutral-200 shadow-sm
                flex items-center justify-center
                hover:bg-neutral-50 hover:border-neutral-300
                transition-all duration-200"
            >
              <ChevronIcon expanded={!isCollapsed} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={style}>
      <div
        ref={cardRef}
        draggable={!position.isVacant}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onClick={() => onPositionClick?.(position)}
        className={`
          relative group cursor-pointer select-none
          transition-all duration-200 ease-out
          ${isDragging ? "opacity-40 scale-95" : "opacity-100"}
          ${dropRingClass}
        `}
      >
        <div
          className={`
            bg-white rounded-xl shadow-sm border
            ${position.isVacant ? "border-dashed border-neutral-400" : `border-neutral-100 border-t-4 ${statusBorderColors[status]}`}
            ${isRoot ? "px-4 py-3" : "px-3 py-2.5"}
            flex items-center gap-3
            hover:shadow-md hover:-translate-y-0.5
            transition-all duration-200
            ${isRoot ? "min-w-[250px]" : "w-[200px]"}
          `}
        >
          <Avatar
            name={position.name}
            avatar={position.avatar}
            size={isRoot ? 48 : 40}
            isVacant={position.isVacant}
          />

          <div className="flex flex-col flex-1 min-w-0">
            <p
              className={`font-semibold leading-tight truncate ${isRoot ? "text-sm" : "text-xs"} ${position.isVacant ? "text-neutral-400" : "text-neutral-900"}`}
            >
              {position.isVacant ? "Vacant" : position.name}
            </p>
            <p
              className={`text-[11px] leading-4 truncate ${position.isVacant ? "text-neutral-400" : "text-neutral-500"}`}
            >
              {position.title}
            </p>
            {!position.isVacant && (
              <div className="flex items-center gap-1 mt-0.5">
                <StatusDot status={status} />
                <span className="text-[10px] text-neutral-400 capitalize">
                  {status.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          {hasChildren && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
              {childCount}
            </div>
          )}
        </div>

        {/* Drop zone indicator label */}
        {dropZone && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap z-20 pointer-events-none
              ${dropZone === "replace"
                ? "-top-6 bg-amber-400 text-white"
                : "-bottom-6 bg-emerald-500 text-white"
              }`}
          >
            {dropZone === "replace"
              ? "⇄ Replace position"
              : "↓ Assign as subordinate"}
          </div>
        )}

        {/* Expand/collapse toggle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(position.id);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10
              w-6 h-6 rounded-full bg-white border border-neutral-200 shadow-sm
              flex items-center justify-center
              hover:bg-neutral-50 hover:border-neutral-300
              transition-all duration-200"
          >
            <ChevronIcon expanded={!isCollapsed} />
          </button>
        )}
      </div>
    </div>
  );
};

// ===================== UNASSIGNED EMPLOYEE CARD =====================
const UnassignedEmployeeCard = ({
  employee,
  onDragStart,
  onDragEnd,
  isDragging,
  onRemove,
}: {
  employee: UnassignedEmployee;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onRemove?: (id: string) => void;
}) => {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", employee.id);
    onDragStart(employee.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        group flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-neutral-100
        cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-neutral-200
        transition-all duration-150 select-none
        ${isDragging ? "opacity-40 scale-95" : ""}
      `}
    >
      <Avatar name={employee.name} avatar={employee.avatar} size={32} />
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs font-semibold text-neutral-900 truncate">{employee.name}</p>
        {employee.role && (
          <p className="text-[10px] text-neutral-400 truncate">{employee.role}</p>
        )}
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(employee.id); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          title="Remove from organization"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ===================== MAIN COMPONENT =====================
export default function PositionTreeView({
  positions,
  onPositionMove,
  onPositionClick,
  unassignedEmployees = [],
  onEmployeeAssign,
  onEmployeeRemove,
  searchActive = false,
}: PositionTreeViewProps) {
  // Start with ALL nodes collapsed (only root visible)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => {
    const allIds = new Set<string>();
    const collectIds = (pos: Position) => {
      if (pos.children && pos.children.length > 0) {
        allIds.add(pos.id);
        pos.children.forEach(collectIds);
      }
    };
    collectIds(positions);
    return allIds;
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"position" | "employee" | null>(null);
  const [manualZoomOffset, setManualZoomOffset] = useState(0);
  const [showPanel, setShowPanel] = useState(true);
  const [unassignedSearch, setUnassignedSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLDivElement>(null);
  const edgeScrollIntervalRef = useRef<number | null>(null);
  const edgeScrollCleanupRef = useRef<{ onMouseMove: (e: MouseEvent) => void; onDragOver: (e: globalThis.DragEvent) => void } | null>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // When search/filter is active, expand all nodes
  const effectiveCollapsedNodes = useMemo(
    () => (searchActive ? new Set<string>() : collapsedNodes),
    [searchActive, collapsedNodes]
  );

  // ---- Calculate visible node count & auto-zoom ----
  const visibleNodeCount = useMemo(
    () => countVisibleNodes(positions, effectiveCollapsedNodes),
    [positions, effectiveCollapsedNodes]
  );

  const autoScale = calculateZoomScale(visibleNodeCount);
  const zoomScale = Math.max(0.3, Math.min(1.5, autoScale + manualZoomOffset * 0.1));
  const zoomPercent = Math.round(zoomScale * 100);

  // ---- Compute tree layout ----
  const layout = useMemo(
    () => computeLayout(positions, effectiveCollapsedNodes),
    [positions, effectiveCollapsedNodes],
  );

  // ---- Center on root on mount ----
  useEffect(() => {
    const timer = setTimeout(() => {
      const rootEl = nodeRefs.current.get(positions.id);
      if (rootEl && scrollContainerRef.current) {
        rootEl.scrollIntoView({
          block: "center",
          inline: "center",
          behavior: "instant",
        });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [positions.id]);

  // ---- Edge scrolling when dragging ----
  const EDGE_THRESHOLD = 60;
  const SCROLL_SPEED = 12;

  const startEdgeScrolling = useCallback(() => {
    if (edgeScrollIntervalRef.current) return;

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onDragOver = (e: globalThis.DragEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("dragover", onDragOver);

    edgeScrollIntervalRef.current = window.setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (mouseX < rect.left + EDGE_THRESHOLD) container.scrollLeft -= SCROLL_SPEED;
      else if (mouseX > rect.right - EDGE_THRESHOLD) container.scrollLeft += SCROLL_SPEED;
      if (mouseY < rect.top + EDGE_THRESHOLD) container.scrollTop -= SCROLL_SPEED;
      else if (mouseY > rect.bottom - EDGE_THRESHOLD) container.scrollTop += SCROLL_SPEED;
    }, 16);

    edgeScrollCleanupRef.current = { onMouseMove, onDragOver };
  }, []);

  const stopEdgeScrolling = useCallback(() => {
    if (edgeScrollIntervalRef.current) {
      clearInterval(edgeScrollIntervalRef.current);
      edgeScrollIntervalRef.current = null;
    }
    const cleanup = edgeScrollCleanupRef.current;
    if (cleanup) {
      window.removeEventListener("mousemove", cleanup.onMouseMove);
      window.removeEventListener("dragover", cleanup.onDragOver);
      edgeScrollCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopEdgeScrolling();
  }, [stopEdgeScrolling]);

  // ---- Find sibling IDs of a node ----
  const findSiblingIds = useCallback(
    (nodeId: string, tree: Position): string[] => {
      // BFS to find the parent that contains nodeId as a child
      const queue: Position[] = [tree];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.children) {
          const childIds = current.children.map((c) => c.id);
          if (childIds.includes(nodeId)) {
            return childIds.filter((id) => id !== nodeId);
          }
          queue.push(...current.children);
        }
      }
      return [];
    },
    []
  );

  // Collect all descendant IDs (for collapsing entire subtrees)
  const collectAllDescendantIds = useCallback((tree: Position, nodeId: string): string[] => {
    const ids: string[] = [];
    const findAndCollect = (node: Position): boolean => {
      if (node.id === nodeId) {
        const gather = (n: Position) => {
          if (n.children) {
            for (const child of n.children) {
              ids.push(child.id);
              gather(child);
            }
          }
        };
        gather(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndCollect(child)) return true;
        }
      }
      return false;
    };
    findAndCollect(tree);
    return ids;
  }, []);

  // ---- Accordion toggle: expanding one branch collapses siblings ----
  const handleToggle = useCallback(
    (id: string) => {
      setCollapsedNodes((prev) => {
        const next = new Set(prev);
        const isCurrentlyCollapsed = next.has(id);

        if (isCurrentlyCollapsed) {
          // Expanding this node → collapse all siblings and their subtrees
          next.delete(id);
          const siblingIds = findSiblingIds(id, positions);
          for (const sibId of siblingIds) {
            next.add(sibId);
            // Also collapse all descendants of the sibling
            const descendantIds = collectAllDescendantIds(positions, sibId);
            for (const descId of descendantIds) {
              next.add(descId);
            }
          }
        } else {
          // Collapsing this node
          next.add(id);
        }
        return next;
      });
    },
    [findSiblingIds, collectAllDescendantIds, positions]
  );

  // ---- Drag handlers ----
  const handleDragStart = useCallback(
    (id: string, type: "position" | "employee") => {
      setDraggedId(id);
      setDragType(type);
      startEdgeScrolling();
    },
    [startEdgeScrolling]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragType(null);
    stopEdgeScrolling();
  }, [stopEdgeScrolling]);

  const handleDrop = useCallback(
    (targetId: string, mode: DropMode) => {
      if (!draggedId) return;

      if (dragType === "employee" && onEmployeeAssign) {
        onEmployeeAssign(draggedId, targetId, mode);
      } else if (dragType === "position" && onPositionMove) {
        onPositionMove(draggedId, targetId);
      }

      setDraggedId(null);
      setDragType(null);
      stopEdgeScrolling();
    },
    [draggedId, dragType, onPositionMove, onEmployeeAssign, stopEdgeScrolling]
  );

  const handleEmployeeDragStart = useCallback(
    (id: string) => {
      setDraggedId(id);
      setDragType("employee");
      startEdgeScrolling();
    },
    [startEdgeScrolling]
  );

  // ---- Manual zoom controls ----
  const handleZoomIn = () => setManualZoomOffset((v) => Math.min(v + 1, 5));
  const handleZoomOut = () => setManualZoomOffset((v) => Math.max(v - 1, -5));

  const hasUnassigned = unassignedEmployees.length > 0;
  const filteredUnassigned = unassignedSearch.trim()
    ? unassignedEmployees.filter((e) =>
        e.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
        (e.role ?? "").toLowerCase().includes(unassignedSearch.toLowerCase())
      )
    : unassignedEmployees;

  return (
    <div className="flex gap-3 w-full" style={{ height: "calc(100vh - 200px)" }}>
      {/* Tree area */}
      <div className="flex-1 flex flex-col rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50/50 relative">
        {/* Toolbar: Zoom controls + Panel toggle */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200 shadow-sm px-1 py-0.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
            title="Zoom out"
          >
            <ZoomOutIcon />
          </button>
          <span className="text-[10px] font-semibold text-neutral-500 w-8 text-center select-none">
            {zoomPercent}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
            title="Zoom in"
          >
            <ZoomInIcon />
          </button>

          {hasUnassigned && (
            <>
              <div className="w-px h-4 bg-neutral-200 mx-0.5" />
              <button
                onClick={() => setShowPanel((v) => !v)}
                className={`p-1.5 rounded transition-colors ${showPanel ? "bg-primary/10 text-primary" : "hover:bg-neutral-100 text-neutral-500"}`}
                title={showPanel ? "Hide unassigned panel" : "Show unassigned panel"}
              >
                <PanelToggleIcon open={showPanel} />
              </button>
            </>
          )}
        </div>

        {/* Scrollable tree container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          <div
            ref={treeContentRef}
            className="inline-flex justify-center px-8 py-6 transition-transform duration-300 ease-out"
            style={{
              minWidth: "100%",
              transform: `scale(${zoomScale})`,
              transformOrigin: "top center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: layout.totalWidth,
                height: layout.totalHeight,
                transition: "width 0.3s ease, height 0.3s ease",
              }}
            >
              <TreeConnectors connectors={layout.connectors} />
              {layout.entries.map((entry) => {
                const cardW = entry.isRoot ? ROOT_W : entry.position.isDeptHeader ? DEPT_W : NODE_W;
                return (
                  <NodeCard
                    key={entry.position.id}
                    position={entry.position}
                    isRoot={entry.isRoot}
                    collapsedNodes={effectiveCollapsedNodes}
                    onToggle={handleToggle}
                    draggedId={draggedId}
                    dragType={dragType}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onPositionClick={onPositionClick}
                    nodeRefs={nodeRefs}
                    style={{
                      position: "absolute",
                      left: entry.x - cardW / 2,
                      top: entry.y,
                      transition: "left 0.3s ease, top 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Unassigned Employees Panel — collapsible */}
      {hasUnassigned && (
        <div className={`shrink-0 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${showPanel ? "w-[200px] border border-neutral-100 opacity-100" : "w-0 border-0 opacity-0"}`}>
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-100 bg-neutral-50/50">
            <UsersIcon />
            <span className="text-xs font-semibold text-neutral-700">Unassigned</span>
            <span className="ml-auto text-[10px] font-bold text-neutral-400 bg-neutral-100 rounded-full px-1.5 py-0.5">
              {filteredUnassigned.length}/{unassignedEmployees.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="px-2 pt-2 pb-1">
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-neutral-400 shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-[11px] bg-transparent outline-none text-neutral-700 placeholder-neutral-400"
              />
              {unassignedSearch && (
                <button onClick={() => setUnassignedSearch("")} className="text-neutral-400 hover:text-neutral-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredUnassigned.length === 0 && (
              <p className="text-[10px] text-neutral-400 text-center py-2">No results</p>
            )}
            {filteredUnassigned.map((emp) => (
              <UnassignedEmployeeCard
                key={emp.id}
                employee={emp}
                onDragStart={handleEmployeeDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedId === emp.id}
                onRemove={onEmployeeRemove}
              />
            ))}
          </div>

          {/* Drop zone legend */}
          <div className="px-3 py-2 border-t border-neutral-100 bg-neutral-50/30 space-y-1">
            <p className="text-[10px] text-neutral-500 font-semibold">Drag to a card:</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[9px] text-neutral-400">Top half → Replace position</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[9px] text-neutral-400">Bottom half → Add subordinate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
