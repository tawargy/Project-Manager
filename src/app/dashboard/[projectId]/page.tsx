"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TasksTable from "@/components/project/TasksTable";
import ProjectHero from "@/components/project/ProjectHero";

const fetchProject = async (projectId: string) => {
  const { data } = await axios.get(`/api/projects/${projectId}`);
  return data.project;
};

function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div>Error fetching project details</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectHero />
      <div className="mt-8"></div>
    </div>
  );
}

export default ProjectDetailsPage;
