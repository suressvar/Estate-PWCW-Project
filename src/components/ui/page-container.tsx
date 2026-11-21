import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "7xl" | "full" | "5xl" | "6xl";
}

export function PageContainer({
  children,
  className = "",
  maxWidth = "7xl",
}: PageContainerProps) {
  const maxClass =
    maxWidth === "full"
      ? "max-w-full"
      : maxWidth === "5xl"
      ? "max-w-5xl"
      : maxWidth === "6xl"
      ? "max-w-6xl"
      : "max-w-7xl";

  return (
    <div className={`${maxClass} mx-auto space-y-6 pb-16 animate-in fade-in duration-200 ${className}`}>
      {children}
    </div>
  );
}
