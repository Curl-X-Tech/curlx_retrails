import * as React from "react";

export function useVehicleCardSlider() {
  const [mode, setMode] = React.useState<"weight" | "volume">("weight");
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const activeIndex = mode === "weight" ? 0 : 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const offset = e.touches[0].clientX - touchStartX;
    if ((activeIndex === 0 && offset > 0) || (activeIndex === 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    } else {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    if (dragOffset < -35 && activeIndex === 0) setMode("volume");
    else if (dragOffset > 35 && activeIndex === 1) setMode("weight");
    setTouchStartX(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  return {
    mode,
    setMode,
    activeIndex,
    isDragging,
    dragOffset,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}
