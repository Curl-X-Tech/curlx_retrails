import * as React from "react";
import {
  XIcon,
  CameraIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PencilSimpleLineIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface UnloadingPodModalProps {
  isOpen: boolean;
  podMode: "signature" | "photo";
  onSetPodMode: (mode: "signature" | "photo") => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function UnloadingPodModal({
  isOpen,
  podMode,
  onSetPodMode,
  onConfirm,
  onClose,
}: UnloadingPodModalProps) {
  const [hasSignature, setHasSignature] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCapturePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setCapturedPhoto(
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
      );
      setIsCapturing(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border/90 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
          aria-label="Close POD Modal"
        >
          <XIcon className="size-4" weight="bold" />
        </button>

        <div className="space-y-1 text-left pr-8">
          <h3 className="font-heading font-black text-xl text-foreground">
            {podMode === "signature" ? "Signature" : "Capture a picture"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {podMode === "signature"
              ? "Kindly get store manager signature"
              : "Capture photo of delivered crates at intake dock"}
          </p>
        </div>

        {podMode === "signature" ? (
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
        ) : (
          <div
            onClick={() => {
              if (!capturedPhoto && !isCapturing) fileInputRef.current?.click();
            }}
            className="relative border-2 border-dashed border-border/80 rounded-2xl h-60 w-full overflow-hidden bg-muted/10 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            {capturedPhoto ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                <img
                  src={capturedPhoto}
                  alt="Delivered crates proof"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircleIcon className="size-3.5 text-emerald-400" weight="fill" />
                  <span>Photo Verified</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCapturedPhoto(null);
                  }}
                  className="absolute top-2 right-2 text-[11px] font-bold text-white bg-black/70 hover:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
                >
                  <ArrowsClockwiseIcon className="size-3" weight="bold" />
                  <span>Retake</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 gap-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center pointer-events-none">
                  <CameraIcon className="size-6" weight="bold" />
                </div>
                <div className="pointer-events-none">
                  <p className="font-heading font-black text-xs text-foreground">
                    Proof of Intake
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Tap anywhere to capture intake cargo
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCapturePhoto();
                  }}
                  disabled={isCapturing}
                  className="h-9 px-5 rounded-xl text-xs font-bold bg-[#0070BA] hover:bg-[#0070BA]/90 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <CameraIcon className="size-4 mr-1.5" weight="bold" />
                  <span>{isCapturing ? "Capturing..." : "Capture Photo"}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-left">
          {podMode === "signature" ? (
            <button
              type="button"
              onClick={() => onSetPodMode("photo")}
              className="text-xs font-bold text-[#0070BA] hover:underline cursor-pointer"
            >
              Store manager not available
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetPodMode("signature")}
              className="text-xs font-bold text-[#0070BA] hover:underline cursor-pointer"
            >
              Store manager available
            </button>
          )}
        </div>

        <div className="pt-2">
          <Button
            onClick={onConfirm}
            className="w-full h-12 rounded-2xl font-heading font-black text-sm bg-[#0070BA] hover:bg-[#0070BA]/90 text-white shadow-md cursor-pointer gap-2 flex items-center justify-center transition-all active:scale-95"
          >
            <span>Confirm</span>
            <ArrowRightIcon className="size-4" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}
