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

// 캐싱 방지
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
    redirect("/");
  }
  
  const params = await searchParams;
  const sortKey = params?.sort || "join_date";
  const sortOrder = params?.order || "desc";
  const initialUsers = await getUsers(sortKey, sortOrder);

  return (
    <UsersProvider
      initialUsers={initialUsers}
      initialSortKey={sortKey}
      initialSortOrder={sortOrder}
    >
      <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ResetMeetupCountsButton />
            <CreateUserDialog />
            <SortUser sortKey={sortKey} sortOrder={sortOrder} />
          </div>
        </div>

        <Suspense fallback={<UsersTableSkeleton />}>
          <div className="space-y-4">
            <SearchInput />
            <UsersTable />
          </div>
        </Suspense>
      </div>
    </UsersProvider>
  );
}
