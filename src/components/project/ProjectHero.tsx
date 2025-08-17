"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/project/task-card";
import { BulkActions } from "@/components/project/bulk-actions";
import TaskForm from "@/components/project/TaskForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import type { Project } from "@/types/project";
import type { Task, TaskFilters, BulkTaskUpdate } from "@/types/task";

function ProjectHero() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({ status: "All Status" });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await axios.get("/api/user/me");
      return response.data?.user;
    },
  });

  const {
    data: project,
    isLoading: projectLoading,
    error,
  } = useQuery<Project>({
    queryKey: ["project", params.projectId],
    queryFn: async () => {
      try {
        const response = await axios.get<{ project: Project }>(
          `/api/projects/${params.projectId}`
        );
        if (!response.data) {
          throw new Error("No project data received");
        }
        return response.data.project;
      } catch (err) {
        console.error("Failed to fetch project:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch tasks data
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      try {
        const response = await axios.get<{ tasks: Task[] }>(
          `/api/tasks?projectId=${projectId}`
        );
        if (!response.data) {
          throw new Error("No tasks data received");
        }
        if (!response.data.tasks) {
          throw new Error("Tasks array not found in response");
        }
        return response.data.tasks;
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error("Failed to fetch tasks:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          throw new Error(
            err.response?.data?.message || "Failed to fetch tasks"
          );
        }
        console.error("Failed to fetch tasks:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Calculate task stats
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "Todo").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    review: tasks.filter((t) => t.status === "Review").length,
    done: tasks.filter((t) => t.status === "Done").length,
  };

  // Status colors for badges
  const statusColors: Record<string, string> = {
    "Not Started": "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  // Task handlers
  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Check if user has manager permissions (admin or project manager)
  const hasManagerPermissions =
    userData?.role === "admin" || userData?.role === "project_manager";

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      if (userData?.role !== "developer") {
        toast.error("Permission denied", {
          description: "Only developers can update task status",
        });
        return;
      }

      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success("Status updated", {
        description: `Task status changed to ${newStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Failed to update task status"
          : "Failed to update task status";
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!hasManagerPermissions) {
        toast.error("Permission denied", {
          description: "Only admins and project managers can delete tasks",
        });
        return;
      }

      await axios.delete(`/api/tasks/${taskId}`);
      toast.success("Task deleted", {
        description: "Task has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Failed to delete task"
          : "Failed to delete task";
      toast.error(errorMessage);
    }
  };

  const handleBulkUpdate = async (update: BulkTaskUpdate) => {
    try {
      // If updating status, check for developer role
      if (update.status && userData?.role !== "developer") {
        toast.error("Permission denied", {
          description: "Only developers can update task status",
        });
        return;
      }

      // For other updates, check for manager permissions
      if (!update.status && !hasManagerPermissions) {
        toast.error("Permission denied", {
          description:
            "Only admins and project managers can update task details",
        });
        return;
      }

      await Promise.all(
        selectedTasks.map((taskId) =>
          axios.patch(`/api/tasks/${taskId}`, update)
        )
      );
      toast.success("Bulk update successful", {
        description: `Updated ${selectedTasks.length} tasks`,
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setSelectedTasks([]);
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Failed to update tasks"
          : "Failed to update tasks";
      toast.error(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    try {
      if (!hasManagerPermissions) {
        toast.error("Permission denied", {
          description: "Only admins and project managers can delete tasks",
        });
        return;
      }

      await Promise.all(
        selectedTasks.map((taskId) => axios.delete(`/api/tasks/${taskId}`))
      );
      toast.success("Bulk delete successful", {
        description: `Deleted ${selectedTasks.length} tasks`,
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setSelectedTasks([]);
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Failed to delete tasks"
          : "Failed to delete tasks";
      toast.error(errorMessage);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Project
            </CardTitle>
            <CardDescription>
              There was a problem loading the project data. Please try again
              later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Project Overview skeleton */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Project Overview */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {project?.name || "Loading..."}
              </CardTitle>
              <CardDescription className="mt-2">
                {project?.description}
              </CardDescription>
            </div>
            <Badge className={statusColors[project?.status || "Not Started"]}>
              {project?.status || "Not Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {project?.startDate
                    ? format(new Date(project.startDate), "MMM dd")
                    : "N/A"}{" "}
                  -{" "}
                  {project?.endDate &&
                  !isNaN(new Date(project.endDate).getTime())
                    ? format(new Date(project.endDate), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm text-muted-foreground">
                  ${(project?.budget || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Team</p>
                <p className="text-sm text-muted-foreground">
                  {project?.members?.length || 0} members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={project?.progress || 0} className="w-16" />
                  <span className="text-sm text-muted-foreground">
                    {project?.progress || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {taskStats.todo}
            </div>
            <p className="text-sm text-muted-foreground">Todo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {taskStats.inProgress}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {taskStats.review}
            </div>
            <p className="text-sm text-muted-foreground">Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {taskStats.done}
            </div>
            <p className="text-sm text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Manage project tasks and track progress
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
              {hasManagerPermissions && (
                <Button onClick={() => setShowTaskForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Form Modal */}
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
            projectId={projectId}
            task={editingTask || undefined}
          />

          {/* Bulk Actions */}
          {tasks.length > 0 &&
            (hasManagerPermissions || userData?.role === "developer") && (
              <BulkActions
                selectedTasks={selectedTasks}
                onBulkUpdate={handleBulkUpdate}
                onBulkDelete={handleBulkDelete}
                onClearSelection={() => setSelectedTasks([])}
                showStatusUpdate={userData?.role === "developer"}
                showDelete={hasManagerPermissions}
              />
            )}

          {/* Tasks Grid */}
          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : tasksError ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Failed to load tasks</p>
              <p className="text-sm text-muted-foreground mb-4">
                {tasksError instanceof Error
                  ? tasksError.message
                  : "An unexpected error occurred"}
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Return to Dashboard
                </Button>
                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["tasks", projectId],
                    })
                  }
                >
                  Retry Loading
                </Button>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No tasks found for this project.
              </p>
              {hasManagerPermissions && (
                <Button onClick={() => setShowTaskForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks
                .filter(
                  (task) =>
                    filters.status === "All Status" ||
                    task.status === filters.status
                )
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTasks.includes(task.id)}
                    onSelect={handleTaskSelect}
                    onEdit={(taskToEdit) => {
                      setEditingTask(taskToEdit);
                      setShowTaskForm(true);
                    }}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    canUpdateStatus={userData?.role === "developer"}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default ProjectHero;
