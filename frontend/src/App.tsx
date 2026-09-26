import React from "react";

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          ReTrails
        </h1>
        <p className="text-slate-400 text-sm mb-4">
          Offline-First Full-Stack Application
        </p>
        <div className="inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
          Team CurlX
        </div>
      </div>
    </div>
  );
}

export default App;
