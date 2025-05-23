import { memo } from "react";
import { UserCard } from "./user-card";
import { User } from "../\bactions";

interface UserCardListProps {
  users: User[];
  searchTerm: string;
  onUpdate: () => Promise<void>;
}

export const UserCardList = memo(function UserCardList({
  users,
  searchTerm,
  onUpdate,
}: UserCardListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} onUpdate={onUpdate} />
      ))}
    </div>
  );
});
