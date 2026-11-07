import type { Metadata } from "next";
import Composer from "@/components/Composer";

export const metadata: Metadata = { title: "Say it nicely", robots: { index: false } };

export default function AppPage({ searchParams }: { searchParams: { welcome?: string } }) {
  return <Composer welcome={searchParams.welcome === "1"} />;
}
