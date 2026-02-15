import React, { useMemo, useState } from "react";
import { fetchAnimeMap } from "../api";
import type { MapEdge, MapNode } from "../types";

const VIEW_W = 3200;
const VIEW_H = 2200;
const PANEL_H = 780;

function shortTitle(title: string, max = 18): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}...`;
}

export default function AnimeMapTab() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0.56);
  const [offset, setOffset] = useState({ x: 440, y: 230 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const map = await fetchAnimeMap(700, 5);
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

  const positionedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        px: 120 + node.x * (VIEW_W - 240),
        py: 120 + node.y * (VIEW_H - 240),
      })),
    [nodes]
  );

  const nodeById = useMemo(() => {
    const map = new Map<number, (MapNode & { px: number; py: number })>();
    positionedNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [positionedNodes]);

  const selected = useMemo(
    () => positionedNodes.find((node) => node.id === selectedId) ?? null,
    [positionedNodes, selectedId]
  );

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.25, Math.min(2.8, z + delta)));
  };

  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp: React.PointerEventHandler<SVGSVGElement> = () => {
    setDragging(false);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-3 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20">
        <div className="mb-2 flex items-center justify-between px-2 text-xs text-slate-600 dark:text-slate-300">
          <span>
            {nodes.length.toLocaleString()} anime nodes | scroll to zoom, drag to pan
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
              className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
            >
              -
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.8, z + 0.1))}
              className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
            >
              +
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid h-[780px] place-items-center text-sm text-slate-500 dark:text-slate-400">
            Building static similarity map...
          </div>
        )}
        {error && !loading && (
          <div className="grid h-[780px] place-items-center text-sm text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <svg
            width="100%"
            height={PANEL_H}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="rounded-2xl bg-slate-50 dark:bg-slate-950/80"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
              {edges.map((edge) => {
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
                    strokeOpacity={0.04 + edge.weight * 0.24}
                    strokeWidth={0.5 + edge.weight * 2}
                  />
                );
              })}

              {positionedNodes.map((node) => {
                const isActive = node.id === selectedId;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.px}
                      cy={node.py}
                      r={node.radius + (isActive ? 3 : 0)}
                      fill={isActive ? "#06b6d4" : "#0f172a"}
                      fillOpacity={isActive ? 0.93 : 0.84}
                      stroke={isActive ? "#e0f2fe" : "#334155"}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    <text
                      x={node.px}
                      y={node.py + 2}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill="#f8fafc"
                      pointerEvents="none"
                    >
                      {shortTitle(node.title)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      <aside className="rounded-3xl border border-slate-200/70 bg-white/75 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/65 dark:shadow-black/20">
        {!selected && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Click a bubble to inspect an anime and closest neighbors.
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
              {selected.genres.join(" • ")}
            </p>
            <a
              href={selected.anilist_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200"
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
                  onClick={() => setSelectedId(sim.id)}
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
    </section>
  );
}
