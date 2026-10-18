import { INITIAL_PROJECTS } from "@/data/initialData";
import ProjectCaseStudyClient from "./ProjectCaseStudyClient";

export async function generateStaticParams() {
  return INITIAL_PROJECTS.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProjectCaseStudyClient slug={slug} />;
}
