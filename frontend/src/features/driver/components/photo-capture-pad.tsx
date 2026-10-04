import * as React from "react";
import { CameraIcon, ArrowsClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PhotoCapturePadProps {
  onPhotoCaptured?: (photo: string | null) => void;
}

export function PhotoCapturePad({ onPhotoCaptured }: PhotoCapturePadProps) {
  const [capturedPhoto, setCapturedPhoto] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedPhoto(result);
        onPhotoCaptured?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const photo =
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80";
      setCapturedPhoto(photo);
      setIsCapturing(false);
      onPhotoCaptured?.(photo);
    }, 600);
  };

  return (
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
              onPhotoCaptured?.(null);
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
  );
}
