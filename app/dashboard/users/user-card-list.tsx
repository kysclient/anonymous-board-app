import { memo } from "react";
import { UserCard } from "./user-card";
import { User } from "../actions";

interface UserCardListProps {
  users: User[];
}

export const UserCardList = memo(function UserCardList({
  users,
}: UserCardListProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
});
