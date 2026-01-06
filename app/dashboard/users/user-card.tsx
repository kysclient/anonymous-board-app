import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateString } from "@/lib/utils";
import { UserActions } from "./user-actions";
import { IncrementMeetupButton } from "./increment-meetup-button";
import { User } from "../actions";
import { IncreementMakeButton } from "./increment-make-button";
import { useUsers } from "./users-context";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { refreshUsers } = useUsers();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">#{user.id}</div>
            <h3 className="font-semibold">{user.name}</h3>
            <Badge
              variant={user.is_regular === "기존" ? "default" : "secondary"}
            >
              {user.is_regular}
            </Badge>
          </div>
          <UserActions user={user} onUpdate={refreshUsers} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">가입일</div>
            <div>{user.join_date ? formatDateString(user.join_date) : "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">최근 벙 참석일</div>
            <div>
              {user.last_meetup_date
                ? formatDateString(user.last_meetup_date)
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">이번 달 벙 참여</div>
            <div className="font-semibold">{user.meetup_count}회</div>
          </div>
          <div>
            <div className="text-muted-foreground">이번 달 벙주 횟수</div>
            <div className="font-semibold">{user.meetup_make_count}회</div>
          </div>
          <div>
            <div className="text-muted-foreground">누적 벙 참여</div>
            <div className="font-semibold">{user.total_meetup_count}회</div>
          </div>
        </div>
        <div className="mt-4 flex justify-start sm:justify-center">
          <div className="flex flex-row gap-2 text-xs">
            <div className="flex flex-row items-center gap-1">
              <span>벙주 횟수 추가</span>
              <IncreementMakeButton userId={user.id} onSuccess={refreshUsers} />
            </div>

            <div className="flex flex-row items-center gap-1">
              <span>벙 참여 추가</span>
              <IncrementMeetupButton userId={user.id} onSuccess={refreshUsers} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
