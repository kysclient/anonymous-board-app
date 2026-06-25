import { memo } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const UserTableHeader = memo(function UserTableHeader() {
  return (
    <TableHeader>
      <TableRow className="border-b border-md-outline-variant/60 bg-transparent hover:bg-transparent [&_th]:h-11 [&_th]:!text-[11px] [&_th]:font-semibold [&_th]:tracking-[0.04em] [&_th]:text-md-on-surface-variant/65">
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
        <TableHead className="py-3 text-center type-label-medium uppercase text-md-on-surface-variant">
          벙
        </TableHead>
        <TableHead className="py-3 text-center type-label-medium uppercase text-md-on-surface-variant">
          벙주
        </TableHead>
        <TableHead className="py-3 text-right type-label-medium uppercase text-md-on-surface-variant">
          관리
        </TableHead>
      </TableRow>
    </TableHeader>
  );
});
