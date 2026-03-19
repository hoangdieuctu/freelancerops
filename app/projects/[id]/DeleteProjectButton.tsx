"use client";

import { useRouter } from "next/navigation";
import { deleteProject } from "../../actions/projects";

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete project "${projectName}"?`)) return;
    await deleteProject(projectId);
    router.push("/projects");
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete}>
      Delete
    </button>
  );
}
