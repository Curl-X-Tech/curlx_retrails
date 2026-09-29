import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, navGroups } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LiveMapPage } from "@/pages/dispatcher/live-map-page";

function getBreadcrumbs(id: string) {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.id === id) {
        return group.label
          ? [{ label: group.label }, { label: item.title, isCurrent: true }]
          : [{ label: item.title, isCurrent: true }];
      }
      if (item.items) {
        for (const sub of item.items) {
          if (sub.id === id) {
            return group.label
              ? [
                  { label: group.label },
                  { label: item.title },
                  { label: sub.title, isCurrent: true },
                ]
              : [{ label: item.title }, { label: sub.title, isCurrent: true }];
          }
        }
      }
    }
  }
  return [{ label: id, isCurrent: true }];
}

export function App() {
  const [activeNavId, setActiveNavId] = React.useState("live-tracking");
  const crumbs = getBreadcrumbs(activeNavId);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeId={activeNavId} onSelect={setActiveNavId} />
      <SidebarInset className="bg-muted/20 flex flex-col h-screen overflow-hidden">
        {/* Top bar header strictly matching sidebar h-16 height */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb className="flex items-center">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => setActiveNavId("dashboard")}>
                    ReTrails Console
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {crumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <span className="text-muted-foreground font-medium">
                          {crumb.label}
                        </span>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {activeNavId === "live-tracking" ? (
          <LiveMapPage />
        ) : (
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h1 className="text-xl font-heading font-bold text-foreground">
                    {crumbs[crumbs.length - 1]?.label || "Dispatcher Workspace"}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Workspace scope: Western Province Hub (Peliyagoda)
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
