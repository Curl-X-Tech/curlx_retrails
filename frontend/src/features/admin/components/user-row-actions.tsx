import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { MockUserWithMeta } from "@/data/mock-users";
import type { UserColumnActions } from "./user-columns-types";

export function UserRowActions({
  user,
  actions,
}: {
  user: MockUserWithMeta;
  actions: UserColumnActions;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
          />
        }
      >
        <DotsThreeVerticalIcon className="size-4" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => actions.onEdit(user)} className="text-xs gap-2">
          <PencilSimpleIcon className="size-3.5 text-muted-foreground" />
          Edit Account
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onToggleActive(user)}
          className="text-xs gap-2"
        >
          {user.is_active ? (
            <>
              <XCircleIcon className="size-3.5 text-amber-500" />
              Deactivate User
            </>
          ) : (
            <>
              <CheckCircleIcon className="size-3.5 text-emerald-500" />
              Activate User
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(user)}
          className="text-xs gap-2 text-destructive focus:text-destructive"
        >
          <TrashIcon className="size-3.5" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
