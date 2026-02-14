"use client";

import { useSearchParams } from "next/navigation";
import ScrewAR from "@/components/models/screw-ar";

function parsePositiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export default function ARPage() {
  const searchParams = useSearchParams();
  const screwHeight = parsePositiveNumber(searchParams.get("height"), 10);
  const screwRadius = parsePositiveNumber(searchParams.get("radius"), 5);

  return <ScrewAR screwHeight={screwHeight} screwRadius={screwRadius} />;
}
