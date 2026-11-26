import type { Metadata } from "next";
import { BudgetsView } from "@/views/budgets";

export const metadata: Metadata = { title: "Budgets" };

export default function Page() {
  return <BudgetsView />;
}
