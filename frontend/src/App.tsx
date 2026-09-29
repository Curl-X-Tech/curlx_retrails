import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";

export function App() {
  const [activeNavId, setActiveNavId] = React.useState("dashboard");

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeId={activeNavId} onSelect={setActiveNavId} />
      <SidebarInset className="bg-muted/30">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Dispatcher Console</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground capitalize">
              {activeNavId.replace("-", " ")}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h1 className="text-xl font-heading font-bold text-foreground">
                  ReTrails Dispatcher Workspace
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current View:{" "}
                  <span className="font-semibold text-primary">{activeNavId}</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
