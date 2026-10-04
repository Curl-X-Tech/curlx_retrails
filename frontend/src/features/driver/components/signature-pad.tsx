import * as React from "react";
import { PencilSimpleLineIcon } from "@phosphor-icons/react";

interface SignaturePadProps {
  onSignatureChange?: (hasSig: boolean, dataUrl?: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const [hasSignature, setHasSignature] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);

  const emitSignature = (hasSig: boolean) => {
    const canvas = canvasRef.current;
    if (hasSig && canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange?.(true, dataUrl);
    } else {
      onSignatureChange?.(false, null);
    }
  };

  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(x - rect.left, y - rect.top);
  };

  const drawMove = (x: number, y: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(x - rect.left, y - rect.top);
    ctx.strokeStyle = "#0070BA";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      emitSignature(true);
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    emitSignature(false);
  };

  return (
    <div className="relative border-2 border-dashed border-border/80 rounded-2xl h-60 w-full overflow-hidden bg-muted/10 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
        onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          const t = e.touches[0];
          startDrawing(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          drawMove(t.clientX, t.clientY);
        }}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
      {!hasSignature && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/50 gap-1.5">
          <PencilSimpleLineIcon className="size-6" weight="bold" />
          <span className="text-xs font-semibold">Sign inside the box</span>
        </div>
      )}
      {hasSignature && (
        <button
          type="button"
          onClick={handleClearSignature}
          className="absolute top-2 right-2 text-[11px] font-bold text-muted-foreground hover:text-destructive bg-background/80 backdrop-blur-md px-2 py-1 rounded-md border border-border/60 cursor-pointer shadow-xs"
        >
          Clear
        </button>
      )}
    </div>
  );
}
