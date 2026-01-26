"use client";

import BaseSkeleton from "./BaseSkeleton";

export default function ProfileSkeleton() {
  return (
    <section className="flex flex-col gap-4 sm:gap-5 rounded-2xl border border-[#e2d6c8] bg-[#fbf7f0] p-4 sm:p-6 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
        <BaseSkeleton circle width={80} height={80} className="h-16 w-16 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <BaseSkeleton height={24} width="60%" className="h-5 sm:h-6" />
          <BaseSkeleton height={16} width="40%" className="h-4" />
          <BaseSkeleton height={14} width="30%" className="h-3.5" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] px-3 sm:px-4 py-3 sm:py-4"
          >
            <BaseSkeleton height={16} width="50%" className="h-4 mb-2" />
            <BaseSkeleton height={24} width="60%" className="h-6" />
          </div>
        ))}
      </div>
      <div className="space-y-2 md:max-w-xs">
        <BaseSkeleton height={16} width="80%" className="h-4" />
        <BaseSkeleton height={16} width="90%" className="h-4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <BaseSkeleton key={i} height={28} width={80} className="h-7 rounded-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
