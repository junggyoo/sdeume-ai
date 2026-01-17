"use client";

import dynamic from "next/dynamic";

const PearlDustCanvas = dynamic(
  () =>
    import("@/components/ui/pearl-dust-canvas").then(
      (mod) => mod.PearlDustCanvas
    ),
  { ssr: false }
);

interface PearlDustWrapperProps {
  particleCount?: number;
  mouseRadius?: number;
  particleColor?: string;
  className?: string;
}

export function PearlDustWrapper(props: PearlDustWrapperProps) {
  return <PearlDustCanvas {...props} />;
}
