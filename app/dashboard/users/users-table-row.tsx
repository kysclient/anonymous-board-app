import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateString } from "@/lib/utils";
import { UserActions } from "./user-actions";
import { IncrementMeetupButton } from "./increment-meetup-button";
import { User } from "../actions";
import { IncreementMakeButton } from "./increment-make-button";

interface UserTableRowProps {
  user: User;
  onUpdate: () => Promise<void>;
}

export const UserTableRow = memo(function UserTableRow({
  user,
  onUpdate,
}: UserTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{user.id}</TableCell>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell className="hidden md:table-cell">
        {user.join_date ? formatDateString(user.join_date) : "-"}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {user.last_meetup_date ? formatDateString(user.last_meetup_date) : "-"}
      </TableCell>
      <TableCell>
        <Badge variant={user.is_regular === "기존" ? "default" : "secondary"}>
          {user.is_regular}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{user.meetup_count}</TableCell>
      <TableCell className="text-center">{user.meetup_make_count}</TableCell>
      <TableCell className="text-center hidden md:table-cell">
        {user.total_meetup_count}
      </TableCell>
      <TableCell className="text-center">
        <IncrementMeetupButton userId={user.id} onSuccess={onUpdate} />
      </TableCell>
      <TableCell className="text-center">
        <IncreementMakeButton userId={user.id} onSuccess={onUpdate} />
      </TableCell>
      <TableCell className="text-right">
        <UserActions user={user} onUpdate={onUpdate} />
      </TableCell>
    </TableRow>
  );
});
