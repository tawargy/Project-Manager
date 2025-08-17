"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  username: string;
  role: "Admin" | "ProjectManager" | "Developer" | null;
}

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Not Started", "In Progress", "Completed"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  progress: z.number().min(0).max(100),
  budget: z.number().min(0),
  memberIds: z.array(z.string()).min(1, "At least one member is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const fetchUsers = async () => {
  const { data } = await axios.get("/api/user");
  return data.users;
};

function ProjectForm({ isOpen, onClose }: ProjectFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "Not Started",
      progress: 0,
      budget: 0,
      memberIds: [],
    },
  });

  const mutation = useMutation({
    mutationFn: (newProject: ProjectFormData) => {
      return axios.post("/api/projects", newProject);
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to create project");
      console.log(error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    console.log("form data", data);

    mutation.mutate(data);
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} disabled={isSubmitting} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "status",
                    value as "Not Started" | "In Progress" | "Completed"
                  )
                }
                defaultValue="Not Started"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progress</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                {...register("progress", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                disabled={isSubmitting}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                {...register("budget", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="members">Members</Label>
              <Select
                onValueChange={(value) => {
                  const currentValues = watch("memberIds") || [];
                  if (!currentValues.includes(value)) {
                    setValue("memberIds", [...currentValues, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select members" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberIds && (
                <p className="text-sm text-destructive mt-1">
                  {errors.memberIds.message}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {watch("memberIds")?.map((id) => {
                  const user = users.find((u: User) => u.id === id);
                  return (
                    <div
                      key={id}
                      className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm flex items-center"
                    >
                      {user?.username}
                      <button
                        type="button"
                        className="ml-2"
                        onClick={() =>
                          setValue(
                            "memberIds",
                            watch("memberIds").filter((mId) => mId !== id)
                          )
                        }
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default ProjectForm;
