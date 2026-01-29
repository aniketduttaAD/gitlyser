"use client";

import { type ReactNode } from "react";
import ChartSkeleton from "../skeletons/ChartSkeleton";

type ChartContainerProps = {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
};

export default function ChartContainer({ title, children, loading, error }: ChartContainerProps) {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#efc6c0] bg-[#f9ebe8] p-4 text-sm text-[#a24f45] shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e2d6c8] bg-[#fffdf8] p-2 sm:p-4 shadow-sm overflow-hidden">
      <h3 className="text-xs sm:text-sm font-semibold text-[#5f564d] mb-2 sm:mb-4 uppercase tracking-wide">
        {title}
      </h3>
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}
