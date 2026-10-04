import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface EntityActions<T> {
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}

export function EntityRowActions<T>({
  row,
  actions,
}: {
  row: T;
  actions: EntityActions<T>;
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
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => actions.onEdit(row)} className="text-xs gap-2">
          <PencilSimpleIcon className="size-3.5 text-muted-foreground" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(row)}
          className="text-xs gap-2 text-destructive focus:text-destructive"
        >
          <TrashIcon className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
