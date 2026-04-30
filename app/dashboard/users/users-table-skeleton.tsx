import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersTableSkeleton() {
  return (
    <div className="hidden overflow-hidden rounded-3xl bg-md-surface-container-low sm:block">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-md-outline-variant bg-md-surface-container hover:bg-md-surface-container">
            <TableHead className="w-[60px] py-3 type-label-medium uppercase text-md-on-surface-variant">
              #
            </TableHead>
            <TableHead className="py-3 type-label-medium uppercase text-md-on-surface-variant">
              이름
            </TableHead>
            <TableHead className="hidden py-3 type-label-medium uppercase text-md-on-surface-variant md:table-cell">
              가입일
            </TableHead>
            <TableHead className="hidden py-3 type-label-medium uppercase text-md-on-surface-variant lg:table-cell">
              최근 벙
            </TableHead>
            <TableHead className="py-3 type-label-medium uppercase text-md-on-surface-variant">
              구분
            </TableHead>
            <TableHead className="py-3 text-center type-label-medium uppercase text-md-on-surface-variant">
              이달 참여
            </TableHead>
            <TableHead className="py-3 text-center type-label-medium uppercase text-md-on-surface-variant">
              이달 벙주
            </TableHead>
            <TableHead className="hidden py-3 text-center type-label-medium uppercase text-md-on-surface-variant md:table-cell">
              누적
            </TableHead>
            <TableHead className="py-3 text-right type-label-medium uppercase text-md-on-surface-variant">
              관리
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow
              key={index}
              className="border-b border-md-outline-variant/40"
            >
              <TableCell className="py-3">
                <Skeleton className="h-3.5 w-6 rounded-full" />
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
              </TableCell>
              <TableCell className="hidden py-3 md:table-cell">
                <Skeleton className="h-3.5 w-24 rounded-full" />
              </TableCell>
              <TableCell className="hidden py-3 lg:table-cell">
                <Skeleton className="h-3.5 w-24 rounded-full" />
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-6 w-12 rounded-full" />
              </TableCell>
              <TableCell className="py-3 text-center">
                <Skeleton className="mx-auto h-3.5 w-6 rounded-full" />
              </TableCell>
              <TableCell className="py-3 text-center">
                <Skeleton className="mx-auto h-3.5 w-6 rounded-full" />
              </TableCell>
              <TableCell className="hidden py-3 text-center md:table-cell">
                <Skeleton className="mx-auto h-3.5 w-6 rounded-full" />
              </TableCell>
              <TableCell className="py-3 text-right">
                <Skeleton className="ml-auto h-10 w-10 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
