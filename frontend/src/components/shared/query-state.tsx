import * as React from "react";
import { WarningCircleIcon, TrayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface QueryStateProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  onRetry?: () => void;
  loading: React.ReactNode;
  emptyMessage: string;
  children: React.ReactNode;
}

export function QueryState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loading,
  emptyMessage,
  children,
}: QueryStateProps) {
  if (isLoading) return <>{loading}</>;

  if (error && isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <WarningCircleIcon className="size-6 text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load data</p>
        <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
        {onRetry && (
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <TrayIcon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
