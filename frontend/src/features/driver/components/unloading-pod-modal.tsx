import * as React from "react";
import { XIcon, ArrowRightIcon, CircleNotchIcon, UserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPodImage } from "@/api/deliveries/api";
import { SignaturePad } from "./signature-pad";
import { PhotoCapturePad } from "./photo-capture-pad";

export interface PodConfirmPayload {
  recipient_name: string;
  signature_data_url: string;
  photo_proof_url?: string;
}

interface UnloadingPodModalProps {
  isOpen: boolean;
  podMode: "signature" | "photo";
  onSetPodMode: (mode: "signature" | "photo") => void;
  onConfirm: (payload: PodConfirmPayload) => void;
  onClose: () => void;
}

export function UnloadingPodModal({
  isOpen,
  podMode,
  onSetPodMode,
  onConfirm,
  onClose,
}: UnloadingPodModalProps) {
  const [recipientName, setRecipientName] = React.useState("Store Manager");
  const [signatureData, setSignatureData] = React.useState<string | null>(null);
  const [photoData, setPhotoData] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUploading(true);
    try {
      let finalSignature = signatureData || "data:image/svg+xml;base64,mock";
      let finalPhoto: string | undefined = photoData || undefined;

      if (podMode === "signature" && signatureData && signatureData.startsWith("data:")) {
        const uploadRes = await uploadPodImage(signatureData);
        finalSignature = uploadRes.file_url;
      } else if (
        podMode === "photo" &&
        photoData &&
        (photoData.startsWith("data:") || photoData.startsWith("blob:"))
      ) {
        const uploadRes = await uploadPodImage(photoData);
        finalPhoto = uploadRes.file_url;
      }

      onConfirm({
        recipient_name: recipientName.trim() || "Store Manager",
        signature_data_url: finalSignature,
        photo_proof_url: finalPhoto,
      });
    } catch {
      onConfirm({
        recipient_name: recipientName.trim() || "Store Manager",
        signature_data_url: signatureData || "data:image/svg+xml;base64,mock",
        photo_proof_url: photoData || undefined,
      });
    } finally {
      setIsUploading(false);
    }
  };

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

        <div className="space-y-1 text-left">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <UserIcon className="size-3" weight="bold" />
            <span>Recipient Name</span>
          </label>
          <Input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Store Manager"
            className="h-10 text-xs rounded-xl bg-muted/20 border-border/70"
          />
        </div>

        {podMode === "signature" ? (
          <SignaturePad
            onSignatureChange={(_, dataUrl) => setSignatureData(dataUrl || null)}
          />
        ) : (
          <PhotoCapturePad onPhotoCaptured={(photo) => setPhotoData(photo)} />
        )}

        <div className="text-left">
          {podMode === "signature" ? (
            <button
              type="button"
              onClick={() => onSetPodMode("photo")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Store manager not available
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetPodMode("signature")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Store manager available
            </button>
          )}
        </div>

        <div className="pt-2">
          <Button
            onClick={handleConfirmClick}
            disabled={isUploading}
            className="w-full h-12 rounded-2xl font-heading font-black text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer gap-2 flex items-center justify-center transition-all active:scale-95"
          >
            {isUploading ? (
              <>
                <CircleNotchIcon className="size-4 animate-spin" weight="bold" />
                <span>Uploading Proof...</span>
              </>
            ) : (
              <>
                <span>Confirm Delivery</span>
                <ArrowRightIcon className="size-4" weight="bold" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
