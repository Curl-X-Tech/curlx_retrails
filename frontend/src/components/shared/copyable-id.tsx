import * as React from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyableIdProps {
  id: string;
  prefix?: string;
  truncateLength?: number;
  showCopyIcon?: boolean;
  className?: string;
  stopPropagation?: boolean;
}

export function CopyableId({
  id,
  prefix,
  truncateLength = 4,
  showCopyIcon = true,
  className = "",
  stopPropagation = true,
}: CopyableIdProps) {
  const [copied, setCopied] = React.useState(false);

  const displayId = React.useMemo(() => {
    if (!id) return "";
    if (id.length <= truncateLength * 2 + 3) return id;
    return `${id.slice(0, truncateLength)}...${id.slice(-truncateLength)}`;
  }, [id, truncateLength]);

  const handleCopy = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!id) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={handleCopy}
            className={`group inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground border border-border/50 px-1.5 py-0.5 rounded transition-colors cursor-pointer select-none ${className}`}
            title="Click to copy full ID"
          >
            {prefix && <span className="text-muted-foreground/80">{prefix}</span>}
            <span>{displayId}</span>
            {showCopyIcon && (
              <span className="shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors">
                {copied ? (
                  <CheckIcon className="size-3 text-emerald-500" weight="bold" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </span>
            )}
          </button>
        }
      />
      <TooltipContent className="text-xs font-mono">
        {copied ? "Copied to clipboard" : id}
      </TooltipContent>
    </Tooltip>
  );
}
