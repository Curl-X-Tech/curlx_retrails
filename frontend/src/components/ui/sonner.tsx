import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans text-xs",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs",
          error:
            "group-[.toaster]:border-rose-500/50 group-[.toaster]:text-rose-600 dark:group-[.toaster]:text-rose-400",
          success:
            "group-[.toaster]:border-emerald-500/50 group-[.toaster]:text-emerald-600 dark:group-[.toaster]:text-emerald-400",
          warning:
            "group-[.toaster]:border-amber-500/50 group-[.toaster]:text-amber-600 dark:group-[.toaster]:text-amber-400",
          info: "group-[.toaster]:border-sky-500/50 group-[.toaster]:text-sky-600 dark:group-[.toaster]:text-sky-400",
        },
      }}
      {...props}
    />
  );
}

export { toast };
