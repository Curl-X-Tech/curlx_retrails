interface ActiveTripOfflineBannerProps {
  isOnline: boolean;
}

export function ActiveTripOfflineBanner({ isOnline }: ActiveTripOfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div className="absolute top-3 left-3 right-14 z-10 bg-background/95 backdrop-blur-md border border-red-500/40 rounded-2xl p-2.5 shadow-md flex items-center gap-2.5">
      <div className="size-2.5 rounded-full bg-red-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-foreground block leading-tight">
          Offline Map Active
        </span>
        <span className="text-[10px] text-muted-foreground block leading-tight truncate">
          Progress & proof of deliveries are saved on-device.
        </span>
      </div>
    </div>
  );
}
