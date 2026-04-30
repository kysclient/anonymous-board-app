import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDateString } from "@/lib/utils";
import { UserActions } from "./user-actions";
import { IncrementMeetupButton } from "./increment-meetup-button";
import { User } from "../actions";
import { IncreementMakeButton } from "./increment-make-button";
import { useUsers } from "./users-context";

const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-amber-600",
  "from-emerald-400 to-emerald-600",
  "from-violet-400 to-violet-600",
  "from-sky-400 to-sky-600",
  "from-pink-400 to-pink-600",
  "from-orange-400 to-orange-600",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

interface UserTableRowProps {
  user: User;
}

export const UserTableRow = memo(function UserTableRow({
  user,
}: UserTableRowProps) {
  const { refreshUsers } = useUsers();
  const isNewbie = user.is_regular === "신입";
  const initial = user.name.charAt(0);

  return (
    <TableRow className="border-b border-md-outline-variant/40 transition-colors hover:bg-md-surface-container">
      <TableCell className="py-3 type-label-medium text-md-on-surface-variant">
        {user.id}
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <span
            className={`m3-avatar bg-gradient-to-br ${avatarColor(user.name)}`}
          >
            {initial}
          </span>
          <span className="type-title-small text-md-on-surface">{user.name}</span>
        </div>
      </TableCell>
      <TableCell className="hidden py-3 type-body-small text-md-on-surface-variant md:table-cell">
        {user.join_date ? formatDateString(user.join_date) : "—"}
      </TableCell>
      <TableCell className="hidden py-3 type-body-small text-md-on-surface-variant lg:table-cell">
        {user.last_meetup_date ? formatDateString(user.last_meetup_date) : "—"}
      </TableCell>
      <TableCell className="py-3">
        <span
          className={`m3-pill ${
            isNewbie ? "m3-pill-primary" : ""
          }`}
        >
          {user.is_regular}
        </span>
      </TableCell>
      <TableCell className="py-3 text-center type-title-small text-md-on-surface">
        {user.meetup_count}
      </TableCell>
      <TableCell className="py-3 text-center type-title-small text-md-on-surface">
        {user.meetup_make_count}
      </TableCell>
      <TableCell className="hidden py-3 text-center type-title-small text-md-primary md:table-cell">
        {user.total_meetup_count}
      </TableCell>
      <TableCell className="py-3 text-center">
        <IncrementMeetupButton userId={user.id} onSuccess={refreshUsers} />
      </TableCell>
      <TableCell className="py-3 text-center">
        <IncreementMakeButton userId={user.id} onSuccess={refreshUsers} />
      </TableCell>
      <TableCell className="py-3 text-right">
        <UserActions user={user} onUpdate={refreshUsers} />
      </TableCell>
    </TableRow>
  );
});
