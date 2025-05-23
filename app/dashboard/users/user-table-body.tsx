import { memo } from "react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { User } from "../\bactions";
import { UserTableRow } from "./users-table-row";

interface UserTableBodyProps {
  users: User[];
  searchTerm: string;
  onUpdate: () => Promise<void>;
}

export const UserTableBody = memo(function UserTableBody({
  users,
  searchTerm,
  onUpdate,
}: UserTableBodyProps) {
  if (users.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center">
            {searchTerm ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {users.map((user) => (
        <UserTableRow key={user.id} user={user} onUpdate={onUpdate} />
      ))}
    </TableBody>
  );
});
