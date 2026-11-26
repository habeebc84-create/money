import type { Metadata } from "next";
import { EntriesView } from "@/views/entries";

export const metadata: Metadata = { title: "Passbook" };

export default function Page() {
  return <EntriesView />;
}
