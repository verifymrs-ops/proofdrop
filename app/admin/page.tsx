import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Owner dashboard — ProofDrop",
  description: "Owner-only review and feature-request reporting.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminDashboard />;
}
