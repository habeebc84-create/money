import type { Metadata } from "next";
import { RecurringView } from "@/views/recurring";

export const metadata: Metadata = { title: "Recurring" };

export default function Page() {
  return <RecurringView />;
}
