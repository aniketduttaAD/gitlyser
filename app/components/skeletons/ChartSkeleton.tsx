"use client";

import BaseSkeleton from "./BaseSkeleton";

export default function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-4 shadow-sm">
      <BaseSkeleton height={20} width="40%" className="h-5 mb-4" />
      <div className="space-y-3">
        <BaseSkeleton height={200} width="100%" className="h-48 rounded-lg" />
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <BaseSkeleton key={i} height={12} width={12} className="h-3 w-3 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
