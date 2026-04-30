import { Suspense } from "react";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetMeetupCountsButton } from "./reset-meetup-counts-button";
import { SearchInput } from "./search-input";
import { UsersTable } from "./users-table";
import { UsersProvider } from "./users-context";

import { getUsers } from "../actions";
import { SortUser } from "./sort-user";
import { getAdminStatus } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Users, ShieldCheck, TrendingUp, Crown, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type SortKey = "join_date" | "last_meetup_date" | "name";
export type SortOrder = "asc" | "desc";

interface UsersPageProps {
  searchParams?: Promise<{
    sort?: SortKey;
    order?: SortOrder;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const isAdmin = await getAdminStatus();

  if (!isAdmin) {
    redirect("/deactivate");
  }

  const params = await searchParams;
  const sortKey = params?.sort || "join_date";
  const sortOrder = params?.order || "desc";
  const initialUsers = await getUsers(sortKey, sortOrder);

  const totalMembers = initialUsers.length;
  const totalMeetups = initialUsers.reduce((s, u) => s + u.meetup_count, 0);
  const newcomers = initialUsers.filter((u) => u.is_regular === "신입").length;
  const regulars = initialUsers.filter((u) => u.is_regular === "기존").length;
  const totalMakes = initialUsers.reduce((s, u) => s + u.meetup_make_count, 0);

  return (
    <UsersProvider
      initialUsers={initialUsers}
      initialSortKey={sortKey}
      initialSortOrder={sortOrder}
    >
      <div className="flex flex-col gap-8 pb-16">
        {/* Hero */}
        <header className="m3-card-feature relative overflow-hidden bg-md-secondary-container p-7 sm:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-md-primary-container opacity-60" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="m3-pill m3-pill-primary">
                <ShieldCheck className="h-3 w-3" />
                Admin · Members
              </span>
              <span className="m3-pill">운영자 전용</span>
            </div>
            <div className="space-y-3">
              <h1 className="type-display-medium text-md-on-secondary-container">
                멤버 관리
              </h1>
              <p className="type-body-large max-w-xl text-md-on-secondary-container/85">
                가입 정보, 벙 참여, 벙주 횟수까지 한 화면에서.
              </p>
            </div>
          </div>
        </header>

        {/* Summary tiles */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryTile
            tone="primary"
            icon={<Users className="h-5 w-5" />}
            label="등록 멤버"
            value={totalMembers}
            sub={`기존 ${regulars} · 신입 ${newcomers}`}
          />
          <SummaryTile
            tone="surface"
            icon={<TrendingUp className="h-5 w-5" />}
            label="이번 달 참여"
            value={totalMeetups}
            sub="누적되는 카운트"
          />
          <SummaryTile
            tone="tertiary"
            icon={<Crown className="h-5 w-5" />}
            label="이번 달 벙주"
            value={totalMakes}
            sub="개최 횟수 합계"
          />
          <SummaryTile
            tone="surface"
            icon={<UserPlus className="h-5 w-5" />}
            label="신입 비중"
            value={
              totalMembers > 0
                ? `${Math.round((newcomers / totalMembers) * 100)}%`
                : "—"
            }
            sub={`${newcomers}명 / ${totalMembers}명`}
          />
        </section>

        {/* Toolbar + Table */}
        <Suspense fallback={<UsersTableSkeleton />}>
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 lg:max-w-md">
                <SearchInput />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SortUser />
                <ResetMeetupCountsButton />
                <CreateUserDialog />
              </div>
            </div>

            <UsersTable />
          </section>
        </Suspense>
      </div>
    </UsersProvider>
  );
}

function SummaryTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: "primary" | "tertiary" | "surface";
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  const surfaceClass =
    tone === "primary"
      ? "bg-md-primary-container text-md-on-primary-container"
      : tone === "tertiary"
        ? "bg-md-tertiary-container text-md-on-tertiary-container"
        : "bg-md-surface-container-low text-md-on-surface";

  const iconWrapClass =
    tone === "primary"
      ? "bg-md-primary text-md-on-primary"
      : tone === "tertiary"
        ? "bg-md-tertiary text-md-on-tertiary"
        : "bg-md-secondary-container text-md-on-secondary-container";

  return (
    <div className={`rounded-3xl p-5 sm:p-6 ${surfaceClass}`}>
      <div className="flex items-start justify-between">
        <p className="type-label-large opacity-80">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          {icon}
        </span>
      </div>
      <p className="type-headline-large mt-4 truncate">{value}</p>
      <p className="type-label-medium mt-1 opacity-80">{sub}</p>
    </div>
  );
}
