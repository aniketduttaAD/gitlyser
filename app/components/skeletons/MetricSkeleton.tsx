"use client";

import BaseSkeleton from "./BaseSkeleton";

export default function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-[#e2d6c8] bg-[#f3ede4] px-3 sm:px-4 py-3 sm:py-4">
      <BaseSkeleton height={16} width="50%" className="h-4 mb-2" />
      <BaseSkeleton height={24} width="60%" className="h-6" />
    </div>
  );
}
