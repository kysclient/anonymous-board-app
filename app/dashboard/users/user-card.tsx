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

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { refreshUsers } = useUsers();
  const isNewbie = user.is_regular === "신입";

  return (
    <div className="m3-card-elevated p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`m3-avatar bg-gradient-to-br ${avatarColor(user.name)}`}
          >
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="type-title-medium text-md-on-surface truncate">
                {user.name}
              </h3>
              <span className={`m3-pill ${isNewbie ? "m3-pill-primary" : ""}`}>
                {user.is_regular}
              </span>
            </div>
            <p className="type-label-small text-md-on-surface-variant">
              #{user.id}
            </p>
          </div>
        </div>
        <UserActions user={user} onUpdate={refreshUsers} />
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-md-surface-container p-3">
        <Stat label="이달 참여" value={user.meetup_count} accent />
        <Stat label="이달 벙주" value={user.meetup_make_count} />
        <Stat label="누적" value={user.total_meetup_count} />
      </div>

      {/* Dates */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="type-label-small uppercase text-md-on-surface-variant">
            가입일
          </p>
          <p className="type-body-medium mt-0.5 text-md-on-surface">
            {user.join_date ? formatDateString(user.join_date) : "—"}
          </p>
        </div>
        <div>
          <p className="type-label-small uppercase text-md-on-surface-variant">
            최근 벙
          </p>
          <p className="type-body-medium mt-0.5 text-md-on-surface">
            {user.last_meetup_date
              ? formatDateString(user.last_meetup_date)
              : "—"}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-md-outline-variant pt-3">
        <div className="flex items-center justify-between rounded-full bg-md-surface-container px-4 py-1.5">
          <span className="type-label-medium text-md-on-surface-variant">
            벙 추가
          </span>
          <IncrementMeetupButton userId={user.id} onSuccess={refreshUsers} />
        </div>
        <div className="flex items-center justify-between rounded-full bg-md-surface-container px-4 py-1.5">
          <span className="type-label-medium text-md-on-surface-variant">
            벙주 추가
          </span>
          <IncreementMakeButton userId={user.id} onSuccess={refreshUsers} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`type-headline-small ${
          accent ? "text-md-primary" : "text-md-on-surface"
        }`}
      >
        {value}
      </p>
      <p className="type-label-small uppercase text-md-on-surface-variant">
        {label}
      </p>
    </div>
  );
}
