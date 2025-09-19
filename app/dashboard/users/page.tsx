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

// export const dynamic = "force-dynamic";

export type SortKey = "join_date" | "last_meetup_date" | "name";
export type SortOrder = "asc" | "desc";

interface UsersPageProps {
  searchParams?: {
    sort?: SortKey;
    order?: SortOrder;
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const isAdmin = await getAdminStatus();

  if (!isAdmin) {
    redirect("/");
  }
  const sortKey = searchParams?.sort || "join_date";
  const sortOrder = searchParams?.order || "desc";
  const initialUsers = await getUsers(sortKey, sortOrder);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <UsersProvider initialUsers={initialUsers}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ResetMeetupCountsButton />
            <CreateUserDialog />
            <SortUser sortKey={sortKey} sortOrder={sortOrder} />
          </div>
        </UsersProvider>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersProvider initialUsers={initialUsers}>
          <div className="space-y-4">
            <SearchInput />
            <UsersTable />
          </div>
        </UsersProvider>
      </Suspense>
    </div>
  );
}
