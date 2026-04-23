import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="h-7 w-20 bg-[#ECEEF5] rounded-lg animate-pulse" />
        <div className="h-7 w-20 bg-[#ECEEF5] rounded-lg animate-pulse" />
        <div className="h-7 w-20 bg-[#ECEEF5] rounded-lg animate-pulse" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
