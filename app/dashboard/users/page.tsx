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
        {/* Page header — Apple clean */}
        <header className="pt-1">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-spicy">
            <ShieldCheck className="h-3.5 w-3.5" />
            Members · Admin
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-md-on-surface sm:text-[34px]">
            멤버 관리
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-md-on-surface-variant">
            가입 정보, 벙 참여, 벙주 횟수까지 한 화면에서.
          </p>
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
  icon,
  label,
  value,
  sub,
}: {
  tone?: "primary" | "tertiary" | "surface";
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-md-outline-variant/65 bg-md-surface-container-lowest p-5">
      <div className="flex items-center gap-1.5 text-md-on-surface-variant/70">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-[12px] font-medium tracking-tight">{label}</span>
      </div>
      <p className="mt-3.5 truncate text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-md-on-surface">
        {value}
      </p>
      <p className="mt-2.5 truncate text-[12px] tracking-tight text-md-on-surface-variant/70">
        {sub}
      </p>
    </div>
  );
}
