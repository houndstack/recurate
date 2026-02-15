import React from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import AnimeMapTab from "./components/AnimeMapTab";

export default function App() {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_35%,#f1f5f9_60%,#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,#0f172a_0%,#020617_45%,#000000_100%)] dark:text-slate-100">
      <AnimeMapTab dark={dark} onToggleTheme={toggle} />
    </div>
  );
}
