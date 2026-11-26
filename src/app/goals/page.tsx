import type { Metadata } from "next";
import { GoalsView } from "@/views/goals";

export const metadata: Metadata = { title: "Savings goals" };

export default function Page() {
  return <GoalsView />;
}
