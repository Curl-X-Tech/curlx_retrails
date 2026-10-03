import { XIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "./signature-pad";
import { PhotoCapturePad } from "./photo-capture-pad";

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

        {podMode === "signature" ? <SignaturePad /> : <PhotoCapturePad />}

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
