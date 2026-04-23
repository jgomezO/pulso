import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function AccountsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-[#ECEEF5] rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-[#ECEEF5] rounded-lg animate-pulse" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
