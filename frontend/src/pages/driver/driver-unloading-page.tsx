import { useNavigate } from "react-router-dom";
import { SwipeToConfirm } from "@/components/ui/swipe-to-confirm";
import {
  useDriverUnloading,
  UnloadingHeader,
  UnloadingItemCard,
  UnloadingPodModal,
  UnloadingFlagModal,
} from "@/features/driver";

export function DriverUnloadingPage() {
  const navigate = useNavigate();
  const {
    currentWp,
    verifiedItems,
    expandedItems,
    isFlagModalOpen,
    flaggedItemId,
    flagReason,
    isPodModalOpen,
    podMode,
    setIsFlagModalOpen,
    setFlagReason,
    setIsPodModalOpen,
    setPodMode,
    toggleItemVerification,
    toggleExpandItem,
    handleOpenFlagModal,
    handleConfirmFlagIssue,
    handleFinalDeliveryConfirm,
  } = useDriverUnloading();

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden select-none bg-background">
      <UnloadingHeader
        currentWp={currentWp}
        onBack={() => navigate("/driver/active")}
        onOpenFlagModal={() => handleOpenFlagModal()}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
            Unloading Crates ({verifiedItems.size}/{currentWp.items.length})
          </span>
          <span className="text-xs font-bold text-primary">
            {currentWp.totalCrateCount} Crates · {currentWp.totalWeightKg} kg
          </span>
        </div>

        <div className="space-y-3">
          {currentWp.items.map((item) => (
            <UnloadingItemCard
              key={item.id}
              item={item}
              currentWp={currentWp}
              isVerified={verifiedItems.has(item.id)}
              isExpanded={expandedItems.has(item.id)}
              onToggleVerification={() => toggleItemVerification(item.id)}
              onToggleExpand={() => toggleExpandItem(item.id)}
              onOpenFlagModal={() => handleOpenFlagModal(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border/80 bg-background/95 backdrop-blur-xl shrink-0 shadow-lg">
        <SwipeToConfirm
          label="Swipe to complete delivery"
          confirmedLabel="Opening verification signature..."
          onConfirm={() => setIsPodModalOpen(true)}
          disabled={verifiedItems.size === 0}
          className="h-14 bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-heading font-black"
        />
      </div>

      <UnloadingPodModal
        isOpen={isPodModalOpen}
        podMode={podMode}
        onSetPodMode={setPodMode}
        onConfirm={handleFinalDeliveryConfirm}
        onClose={() => setIsPodModalOpen(false)}
      />

      <UnloadingFlagModal
        isOpen={isFlagModalOpen}
        targetLabel={
          flaggedItemId ? `Item #${flaggedItemId}` : currentWp.outletName
        }
        flagReason={flagReason}
        onSelectReason={setFlagReason}
        onConfirm={handleConfirmFlagIssue}
        onClose={() => setIsFlagModalOpen(false)}
      />
    </div>
  );
}
