import { errorMessage as getErrorMessage } from "@/lib/errors";
import { deleteVoucher,getVoucherById,updateVoucher,VoucherType } from "@/lib/vouchers-data";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ v_type: string; id: string }> }) {
  const { v_type, id } = await params;
  const item = getVoucherById(v_type as VoucherType, id);
  if (!item) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ v_type: string; id: string }> }) {
  const { v_type, id } = await params;
  try {
    const body = await req.json();
    const updated = updateVoucher(v_type as VoucherType, id, body);
    if (!updated) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ v_type: string; id: string }> }) {
  const { v_type, id } = await params;
  const ok = deleteVoucher(v_type as VoucherType, id);
  return NextResponse.json({ success: ok });
}
