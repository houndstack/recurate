import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchAnimeMap } from "../api";
import type { MapEdge, MapNode } from "../types";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const MAP_HEIGHT = 620;

export default function AnimeMapTab() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [width, setWidth] = useState(980);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const positionsRef = useRef<Record<number, Particle>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const map = await fetchAnimeMap(180, 5);
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

  useEffect(() => {
    const updateSize = () => {
      if (!wrapRef.current) return;
      setWidth(Math.max(340, Math.floor(wrapRef.current.clientWidth)));
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!nodes.length) return;

    const centerX = width / 2;
    const centerY = MAP_HEIGHT / 2;
    const radius = Math.min(width, MAP_HEIGHT) * 0.33;

    const next: Record<number, Particle> = {};
    nodes.forEach((node, idx) => {
      const t = (Math.PI * 2 * idx) / Math.max(nodes.length, 1);
      const jitter = 20 * Math.sin(node.id);
      next[node.id] = {
        x: centerX + Math.cos(t) * radius + jitter,
        y: centerY + Math.sin(t) * radius + jitter,
        vx: 0,
        vy: 0,
      };
    });

    positionsRef.current = next;
  }, [nodes, width]);

  useEffect(() => {
    if (!nodes.length || !edges.length) return;

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    let frame = 0;

    const step = () => {
      const p = positionsRef.current;
      const ids = nodes.map((n) => n.id);
      const centerX = width / 2;
      const centerY = MAP_HEIGHT / 2;

      for (let i = 0; i < ids.length; i += 1) {
        const a = p[ids[i]];
        if (!a) continue;
        a.vx *= 0.92;
        a.vy *= 0.92;
        a.vx += (centerX - a.x) * 0.0009;
        a.vy += (centerY - a.y) * 0.0009;
      }

      for (let i = 0; i < ids.length; i += 1) {
        const aId = ids[i];
        const a = p[aId];
        const aNode = nodeById.get(aId);
        if (!a || !aNode) continue;
        for (let j = i + 1; j < ids.length; j += 1) {
          const bId = ids[j];
          const b = p[bId];
          const bNode = nodeById.get(bId);
          if (!b || !bNode) continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy + 0.01;
          const minDist = aNode.radius + bNode.radius + 8;
          const minDistSq = minDist * minDist;

          if (distSq < minDistSq * 3.2) {
            const force = 150 / distSq;
            a.vx += dx * force;
            a.vy += dy * force;
            b.vx -= dx * force;
            b.vy -= dy * force;
          }
        }
      }

      for (const edge of edges) {
        const a = p[edge.source];
        const b = p[edge.target];
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const targetDist = 90 - edge.weight * 42;
        const spring = (dist - targetDist) * (0.004 + edge.weight * 0.004);
        const fx = (dx / dist) * spring;
        const fy = (dy / dist) * spring;

        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      for (const id of ids) {
        const point = p[id];
        if (!point) continue;

        point.x += point.vx;
        point.y += point.vy;

        point.x = Math.max(20, Math.min(width - 20, point.x));
        point.y = Math.max(20, Math.min(MAP_HEIGHT - 20, point.y));
      }

      frame = window.requestAnimationFrame(step);
      setTick((n) => n + 1);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [edges, nodes, width]);

  const selected = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-3 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/20 to-transparent dark:from-cyan-500/10" />
        {loading && (
          <div className="grid h-[620px] place-items-center text-sm text-slate-500 dark:text-slate-400">
            Building anime map...
          </div>
        )}
        {error && !loading && (
          <div className="grid h-[620px] place-items-center text-sm text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}
        {!loading && !error && (
          <svg
            key={tick}
            width={width}
            height={MAP_HEIGHT}
            viewBox={`0 0 ${width} ${MAP_HEIGHT}`}
            className="relative z-10"
          >
            {edges.map((edge) => {
              const a = positionsRef.current[edge.source];
              const b = positionsRef.current[edge.target];
              if (!a || !b) return null;
              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={selectedId === edge.source || selectedId === edge.target ? "#22d3ee" : "#64748b"}
                  strokeOpacity={0.08 + edge.weight * 0.34}
                  strokeWidth={0.6 + edge.weight * 2.8}
                />
              );
            })}

            {nodes.map((node) => {
              const point = positionsRef.current[node.id];
              if (!point) return null;
              const isActive = selectedId === node.id;
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={node.radius + (isActive ? 3 : 0)}
                    fill={isActive ? "#06b6d4" : "#0f172a"}
                    fillOpacity={isActive ? 0.9 : 0.82}
                    stroke={isActive ? "#e0f2fe" : "#334155"}
                    strokeWidth={isActive ? 2.2 : 1.1}
                  />
                </g>
              );
            })}
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
