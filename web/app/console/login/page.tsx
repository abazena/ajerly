import { redirect } from "next/navigation";

// Legacy operator-login URL. Unified /login accepts email → operator flow now.
export default function Page(): never {
  redirect("/login");
}
