import React, { useMemo, useRef, useState } from "react";
import { fetchAnimeMap } from "../api";
import type { MapEdge, MapNode } from "../types";

const VIEW_W = 6000;
const VIEW_H = 4200;

const CLUSTER_COLORS = [
  "#0284c7",
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#c2410c",
  "#be185d",
  "#15803d",
  "#0369a1",
  "#a21caf",
  "#ca8a04",
  "#334155",
  "#b91c1c",
];

function shortTitle(title: string, max = 18): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}...`;
}

export default function AnimeMapTab() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const movedRef = useRef(false);
  const directClickRef = useRef<number | null>(null);
  const zoomRef = useRef(0.45);
  const offsetRef = useRef({ x: 380, y: 260 });
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWakeMessage, setShowWakeMessage] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(0.45);
  const [offset, setOffset] = useState({ x: 380, y: 260 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const map = await fetchAnimeMap(900, 5);
        setNodes(map.nodes);
        setEdges(map.edges);
        setSelectedId(map.nodes[0]?.id ?? null);
      } catch {
        setError("Failed to load anime map.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    if (!loading) {
      setShowWakeMessage(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowWakeMessage(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [loading]);

  const positionedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        px: 140 + node.x * (VIEW_W - 280),
        py: 140 + node.y * (VIEW_H - 280),
      })),
    [nodes]
  );

  const nodeById = useMemo(() => {
    const map = new Map<number, (MapNode & { px: number; py: number })>();
    positionedNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [positionedNodes]);

  const visibleEdges = useMemo(
    () => edges.filter((edge) => edge.weight >= 0.54).slice(0, 14000),
    [edges]
  );

  const selected = useMemo(
    () => positionedNodes.find((node) => node.id === selectedId) ?? null,
    [positionedNodes, selectedId]
  );

  const visibleLabelIds = useMemo(() => {
    const ranked = positionedNodes
      .map((node) => ({
        id: node.id,
        score: node.radius * zoom,
        popularity: node.popularity,
      }))
      .filter((n) => n.score >= 3.5)
      .sort((a, b) => b.score - a.score || b.popularity - a.popularity);

    const maxLabels = Math.max(24, Math.min(320, Math.floor(36 + zoom * 130)));
    const ids = new Set<number>();

    for (let i = 0; i < Math.min(maxLabels, ranked.length); i += 1) {
      ids.add(ranked[i].id);
    }

    if (selectedId !== null) ids.add(selectedId);
    return ids;
  }, [positionedNodes, selectedId, zoom]);

  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...positionedNodes].sort((a, b) => b.popularity - a.popularity);
    if (!q) return base.slice(0, 45);
    return base
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 45);
  }, [positionedNodes, query]);

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0, sx: 1, sy: 1 };
    const rect = svg.getBoundingClientRect();
    const sx = VIEW_W / rect.width;
    const sy = VIEW_H / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
      sx,
      sy,
    };
  };

  const focusNode = (id: number, recenter = true) => {
    const node = nodeById.get(id);
    if (!node) return;
    setSelectedId(id);
    if (!recenter) return;

    const nextZoom = Math.max(zoomRef.current, 1.25);
    zoomRef.current = nextZoom;
    setZoom(nextZoom);

    const nextOffset = {
      x: VIEW_W / 2 - node.px * nextZoom,
      y: VIEW_H / 2 - node.py * nextZoom,
    };
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const pointer = toSvgPoint(e.clientX, e.clientY);

    setZoom((prevZoom) => {
      const step = e.deltaY > 0 ? 0.88 : 1.14;
      const nextZoom = Math.max(0.18, Math.min(18, prevZoom * step));

      setOffset((prevOffset) => {
        const worldX = (pointer.x - prevOffset.x) / prevZoom;
        const worldY = (pointer.y - prevOffset.y) / prevZoom;
        const nextOffset = {
          x: pointer.x - worldX * nextZoom,
          y: pointer.y - worldY * nextZoom,
        };
        offsetRef.current = nextOffset;
        return nextOffset;
      });

      zoomRef.current = nextZoom;
      return nextZoom;
    });
  };

  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    directClickRef.current = null;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) movedRef.current = true;

    const pointer = toSvgPoint(e.clientX, e.clientY);
    setOffset((prev) => {
      const next = {
        x: prev.x + dx * pointer.sx,
        y: prev.y + dy * pointer.sy,
      };
      offsetRef.current = next;
      return next;
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const pickNodeAtClientPoint = (clientX: number, clientY: number): number | null => {
    const p = toSvgPoint(clientX, clientY);
    const worldX = (p.x - offsetRef.current.x) / zoomRef.current;
    const worldY = (p.y - offsetRef.current.y) / zoomRef.current;

    let hitId: number | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const node of positionedNodes) {
      const dx = worldX - node.px;
      const dy = worldY - node.py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = node.radius + 5;
      if (dist > hitRadius) continue;

      const score = dist / Math.max(node.radius, 1);
      if (score < bestScore) {
        bestScore = score;
        hitId = node.id;
      }
    }

    return hitId;
  };

  const onPointerUp: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (directClickRef.current !== null) {
      focusNode(directClickRef.current, false);
      directClickRef.current = null;
    } else if (!movedRef.current) {
      const hitId = pickNodeAtClientPoint(e.clientX, e.clientY);
      if (hitId !== null) {
        focusNode(hitId, false);
      }
    }
    setDragging(false);
  };

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`h-full w-full touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"} bg-slate-50 dark:bg-slate-950/85`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {loading && (
          <text
            x={VIEW_W / 2}
            y={VIEW_H / 2}
            textAnchor="middle"
            fontSize="42"
            fill="#64748b"
          >
            Building map...
          </text>
        )}
        {error && !loading && (
          <text
            x={VIEW_W / 2}
            y={VIEW_H / 2}
            textAnchor="middle"
            fontSize="36"
            fill="#e11d48"
          >
            {error}
          </text>
        )}

        {!loading && !error && (
          <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
            {visibleEdges.map((edge) => {
              const a = nodeById.get(edge.source);
              const b = nodeById.get(edge.target);
              if (!a || !b) return null;
              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={a.px}
                  y1={a.py}
                  x2={b.px}
                  y2={b.py}
                  stroke={selectedId === edge.source || selectedId === edge.target ? "#22d3ee" : "#64748b"}
                  strokeOpacity={0.03 + edge.weight * 0.2}
                  strokeWidth={0.5 + edge.weight * 1.8}
                />
              );
            })}

            {positionedNodes.map((node) => {
              const isActive = node.id === selectedId;
              const baseColor = CLUSTER_COLORS[node.cluster % CLUSTER_COLORS.length];
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movedRef.current) return;
                    directClickRef.current = node.id;
                    focusNode(node.id, false);
                  }}
                >
                  <circle
                    cx={node.px}
                    cy={node.py}
                    r={node.radius + (isActive ? 3 : 0)}
                    fill={isActive ? "#f8fafc" : baseColor}
                    fillOpacity={isActive ? 0.96 : 0.82}
                    stroke={isActive ? "#22d3ee" : "#e2e8f0"}
                    strokeWidth={isActive ? 3 : 1.1}
                  />
                  {visibleLabelIds.has(node.id) && (
                    <text
                      x={node.px}
                      y={node.py + 2}
                      textAnchor="middle"
                      fontSize={Math.max(8, Math.min(12, node.radius * 0.45))}
                      fontWeight={700}
                      fill={isActive ? "#0f172a" : "#f8fafc"}
                      pointerEvents="none"
                    >
                      {shortTitle(node.title, isActive ? 26 : 17)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute right-4 top-4 z-20 rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 shadow dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200"
      >
        {sidebarOpen ? "Hide Info" : "Show Info"}
      </button>

      <aside
        className={`absolute right-4 top-16 z-20 h-[calc(100%-5rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur transition-all dark:border-slate-700 dark:bg-slate-900/85 ${
          sidebarOpen ? "w-[360px] opacity-100" : "w-0 overflow-hidden border-0 p-0 opacity-0"
        }`}
      >
        {loading && showWakeMessage && (
          <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Backend may be waking up on Render free tier. Initial map load can take ~30-60 seconds.
          </p>
        )}
        <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
          {nodes.length.toLocaleString()} nodes | {Math.round(zoom * 100)}% zoom
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime in map..."
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />

        <div className="mb-4 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
          {directory.map((node) => (
            <button
              key={node.id}
              onClick={() => focusNode(node.id, true)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="truncate pr-2 text-slate-700 dark:text-slate-200">
                {node.title}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {Math.round(node.popularity / 1000)}k
              </span>
            </button>
          ))}
        </div>

        {!selected && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Click a bubble to inspect details and similar anime.
          </p>
        )}

        {selected && (
          <div>
            <img
              src={selected.cover_image}
              alt={selected.title}
              className="mb-3 h-48 w-full rounded-2xl object-cover"
            />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {selected.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Popularity: {selected.popularity.toLocaleString()} | Score: {selected.score}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selected.genres.join(" | ")}
            </p>
            <a
              href={selected.anilist_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300"
            >
              Open on AniList
            </a>

            <h4 className="mt-5 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
              MOST SIMILAR
            </h4>
            <div className="mt-2 space-y-2">
              {selected.similar.map((sim) => (
                <button
                  key={`${selected.id}-${sim.id}`}
                  onClick={() => focusNode(sim.id, true)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-left text-xs transition hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900"
                >
                  <span className="pr-3 text-slate-700 dark:text-slate-200">
                    {sim.title}
                  </span>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-700 dark:text-cyan-300">
                    {Math.round(sim.similarity * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
