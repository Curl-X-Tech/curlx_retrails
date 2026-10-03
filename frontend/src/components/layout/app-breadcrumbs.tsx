import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBreadcrumbs, type CrumbItem } from "./breadcrumbs-resolver";

export { getBreadcrumbs, type CrumbItem };

export function AppBreadcrumbs({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <Breadcrumb className="flex items-center truncate">
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <BreadcrumbSeparator className="hidden sm:inline" />}
            <BreadcrumbItem>
              {crumb.isCurrent ? (
                <BreadcrumbPage
                  className={
                    crumb.isCode
                      ? "font-bold tracking-tight text-foreground text-xs sm:text-sm"
                      : "text-xs sm:text-sm font-semibold"
                  }
                >
                  {crumb.label}
                </BreadcrumbPage>
              ) : crumb.path ? (
                <BreadcrumbLink
                  onClick={() => navigate(crumb.path!)}
                  className="cursor-pointer hover:text-foreground transition-colors text-xs sm:text-sm"
                >
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground font-medium text-xs sm:text-sm">
                  {crumb.label}
                </span>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
