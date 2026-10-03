import * as React from "react";
import {
  PhoneCallIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";

interface AllocationDriverContactBarProps {
  driverName: string;
  phone: string;
}

export function AllocationDriverContactBar({
  driverName,
  phone,
}: AllocationDriverContactBarProps) {
  const [showPhone, setShowPhone] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const rawPhone = phone || "+94 77 123 4567";
  const maskedPhone = rawPhone.replace(/\d(?=\d{2})/g, "•");

  const handleCopyPhone = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
      <div className="flex items-center gap-1.5 bg-muted/80 px-2 py-1 rounded-xl border border-border/60 min-w-0 flex-1 justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <PhoneIcon className="size-3.5 text-primary shrink-0" weight="bold" />
          <span className="text-[11px] text-foreground font-semibold select-none truncate">
            {showPhone ? rawPhone : maskedPhone}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setShowPhone(!showPhone)}
            className="size-5.5 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-md cursor-pointer"
            title={showPhone ? "Hide phone number" : "Show phone number"}
          >
            {showPhone ? (
              <EyeSlashIcon className="size-3.5" weight="bold" />
            ) : (
              <EyeIcon className="size-3.5" weight="bold" />
            )}
          </IconButton>

          <IconButton
            variant="ghost"
            size="xs"
            onClick={handleCopyPhone}
            className={`size-5.5 rounded-md cursor-pointer transition-colors ${
              copied
                ? "text-emerald-600 bg-emerald-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            }`}
            title={copied ? "Copied to clipboard!" : "Copy phone number"}
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-emerald-600" weight="bold" />
            ) : (
              <CopyIcon className="size-3.5" weight="bold" />
            )}
          </IconButton>
        </div>
      </div>

      <a
        href={`tel:${rawPhone}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        title={`Call ${driverName}`}
      >
        <PhoneCallIcon className="size-3.5" weight="fill" />
        <span>Call</span>
      </a>
    </div>
  );
}
