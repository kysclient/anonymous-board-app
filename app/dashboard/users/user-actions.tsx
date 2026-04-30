"use client";

import { useState } from "react";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { User } from "../actions";

interface UserActionsProps {
  user: User;
  onUpdate: () => Promise<void>;
}

export function UserActions({ user, onUpdate }: UserActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="m3-icon-btn" aria-label="메뉴 열기">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-2xl">
          <DropdownMenuItem
            onClick={() => setShowEditDialog(true)}
            className="rounded-full type-label-large"
          >
            <Edit className="mr-2 h-4 w-4" />
            편집
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-full type-label-large text-md-error focus:text-md-error"
          >
            <Trash className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUpdate}
      />

      <DeleteUserDialog
        userId={user.id}
        userName={user.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onUpdate}
      />
    </>
  );
}
