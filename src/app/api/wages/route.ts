import { NextResponse } from "next/server";
import { getWages } from "@/lib/hr-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const year = yearParam ? parseInt(yearParam) : undefined;
  const month = monthParam ? parseInt(monthParam) : undefined;

  const list = getWages(year, month);
  return NextResponse.json(list);
}
