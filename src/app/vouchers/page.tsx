import { redirect } from "next/navigation";

export default function VouchersRedirect() {
  redirect("/purchases");
}
