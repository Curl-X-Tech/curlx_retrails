import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  orientation = "horizontal",
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        orientation,
      }}
    >
      <div
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-row gap-4" : "flex-col gap-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "line";
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const orientation = context?.orientation || "horizontal";

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          "inline-flex items-center",
          variant === "default" && "h-8 rounded-lg bg-muted p-1 text-muted-foreground",
          variant === "line" &&
            (orientation === "vertical"
              ? "flex-col border-r border-border gap-1"
              : "border-b border-border gap-4"),
          className
        )}
        {...props}
      />
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: "default" | "line";
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, variant = "default", ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isSelected = context?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => context?.onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && [
            "rounded-md",
            isSelected
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          ],
          variant === "line" && [
            "relative pb-2 font-semibold",
            isSelected
              ? "text-primary border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context?.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn("focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
