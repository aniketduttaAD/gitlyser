"use client";

type BaseSkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
};

export default function BaseSkeleton({
  className = "",
  width,
  height,
  circle = false,
}: BaseSkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-[#e2d6c8] rounded ${circle ? "rounded-full" : ""} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
