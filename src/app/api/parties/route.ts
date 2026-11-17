import { errorMessage as getErrorMessage } from "@/lib/errors";
import type { PartyType } from "@/lib/parties-data";
import { createParty,getParties } from "@/lib/parties-data";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as PartyType | null;

  const parties = getParties(type || undefined);
  return NextResponse.json(parties);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }

    const party = createParty({
      name: body.name.trim(),
      type: body.type || "Retailer",
      phone: body.phone?.trim() || "",
      email: body.email?.trim() || "",
      city: body.city?.trim() || "",
      address: body.address?.trim() || "",
      notes: body.notes?.trim() || "",
      ...(body.gstin ? { gstin: body.gstin.trim() } : {}),
      ...(body.status ? { status: body.status } : {}),
    });

    return NextResponse.json(party, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) || "Failed to create party" }, { status: 400 });
  }
}
