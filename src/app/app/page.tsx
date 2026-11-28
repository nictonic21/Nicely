import type { Metadata } from "next";
import Composer from "@/components/Composer";
import PurchaseTracker from "@/components/PurchaseTracker";

export const metadata: Metadata = { title: "Say it nicelyy", robots: { index: false } };

export default function AppPage({ searchParams }: { searchParams: { welcome?: string } }) {
  return (
    <>
      <PurchaseTracker />
      <Composer welcome={searchParams.welcome === "1"} />
    </>
  );
}
