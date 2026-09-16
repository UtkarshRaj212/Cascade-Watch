import { Metadata } from "next";
import { getDashboardData } from "@/lib/db/queries";
import { DashboardContainer } from "@/components/DashboardContainer";

export const metadata: Metadata = {
  title: "CascadeWatch | Healthcare Supply-Chain Early Warning & Cascade Intelligence",
  description: "Decision-support system for predicting medicine stockouts and cascade ripple failures across referral healthcare networks.",
};

// Revalidate or dynamic server rendering
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboardData = await getDashboardData();

  return <DashboardContainer initialData={dashboardData} />;
}
