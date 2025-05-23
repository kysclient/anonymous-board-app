import { Suspense } from "react";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetMeetupCountsButton } from "./reset-meetup-counts-button";
import { SearchInput } from "./search-input";
import { UsersTable } from "./users-table";
import { UsersProvider } from "./users-context";
import { getUsers } from "../\bactions";

export default async function UsersPage() {
  const initialUsers = await getUsers();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
       
        <UsersProvider initialUsers={initialUsers}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ResetMeetupCountsButton />
            <CreateUserDialog />
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
