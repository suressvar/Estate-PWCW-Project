import { NextResponse } from "next/server";
import { issueGodownItemToMenu } from "@/lib/godown-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.godownItemId) {
      return NextResponse.json({ error: "godownItemId is required" }, { status: 400 });
    }

    if (!body.destinationMenu) {
      return NextResponse.json({ error: "destinationMenu is required" }, { status: 400 });
    }

    if (!body.quantity || Number(body.quantity) <= 0) {
      return NextResponse.json({ error: "Valid issue quantity is required" }, { status: 400 });
    }

    const result = issueGodownItemToMenu({
      godownItemId: body.godownItemId,
      destinationMenu: body.destinationMenu,
      quantity: Number(body.quantity),
      date: body.date || new Date().toISOString().split("T")[0],
      plotId: body.plotId,
      plotName: body.plotName,
      cropActivityId: body.cropActivityId,
      cropActivityName: body.cropActivityName,
      issuedTo: body.issuedTo || "Field Staff",
      notes: body.notes || "",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
