import { INITIAL_EVIDENCE } from "@/data/initialData";
import EvidenceDetailClient from "./EvidenceDetailClient";

export async function generateStaticParams() {
  return INITIAL_EVIDENCE.map((item) => ({
    slug: item.slug,
  }));
}

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EvidenceDetailClient slug={slug} />;
}
