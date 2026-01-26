"use client";

import BaseSkeleton from "./BaseSkeleton";

export default function RepoCardSkeleton() {
  return (
    <article className="rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <BaseSkeleton height={28} width="40%" className="h-7" />
            <div className="flex items-center gap-2">
              <BaseSkeleton height={24} width={60} className="h-6 rounded-full" />
              <BaseSkeleton height={24} width={70} className="h-6 rounded-full" />
            </div>
          </div>
          <BaseSkeleton height={20} width="90%" className="h-5" />
          <BaseSkeleton height={20} width="70%" className="h-5" />
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <BaseSkeleton key={i} height={28} width={60} className="h-7 rounded-full" />
            ))}
          </div>
        </div>
        <BaseSkeleton height={40} width={120} className="h-10 rounded-xl md:w-auto" />
      </div>
    </article>
  );
}
