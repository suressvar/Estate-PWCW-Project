import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createVoucher,getVouchers,VoucherType } from "@/lib/vouchers-data";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ v_type: string }> }) {
  const { v_type } = await params;
  const list = getVouchers(v_type as VoucherType);
  return NextResponse.json(list);
}

export async function POST(req: Request, { params }: { params: Promise<{ v_type: string }> }) {
  const { v_type } = await params;
  try {
    const body = await req.json();
    const created = createVoucher(v_type as VoucherType, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
