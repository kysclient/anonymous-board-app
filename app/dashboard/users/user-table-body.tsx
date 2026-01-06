import { memo } from "react";
import { TableBody } from "@/components/ui/table";
import { User } from "../actions";
import { UserTableRow } from "./users-table-row";

interface UserTableBodyProps {
  users: User[];
}

export const UserTableBody = memo(function UserTableBody({
  users,
}: UserTableBodyProps) {
  return (
    <TableBody>
      {users.map((user) => (
        <UserTableRow key={user.id} user={user} />
      ))}
    </TableBody>
  );
});
