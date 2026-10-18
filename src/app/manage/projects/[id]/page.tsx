import { INITIAL_PROJECTS } from "@/data/initialData";
import EditProjectClient from "./EditProjectClient";

export async function generateStaticParams() {
  return INITIAL_PROJECTS.map((project) => ({
    id: project.id,
  }));
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProjectClient id={id} />;
}
