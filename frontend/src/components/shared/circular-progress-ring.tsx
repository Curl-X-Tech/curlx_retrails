import * as React from "react";

interface CircularProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClassName?: string;
  children?: React.ReactNode;
}

export function CircularProgressRing({
  value,
  size = 22,
  strokeWidth = 3,
  colorClassName,
  children,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const defaultColor = (pct: number) => {
    if (pct >= 90) return "text-red-500";
    if (pct >= 75) return "text-orange-500";
    return "text-emerald-500";
  };

  const ringColor = colorClassName ?? defaultColor(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform-gpu"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${ringColor}`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}
