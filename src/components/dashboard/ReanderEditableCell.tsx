import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types/project";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";

const statusColors = {
  "Not Started":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "In Progress":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

interface EditingCell {
  projectId: string;
  field: keyof Project;
  value: string | number;
}
type TPros = {
  project: Project;
  field: keyof Project;
  value: string | number;
  isEditable?: boolean;
};

function RenderEditableCell({
  project,
  field,
  value,
  isEditable = false,
}: TPros) {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const isEditing =
    editingCell?.projectId === project.id && editingCell?.field === field;

  const updateProjectMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Project>;
    }) => {
      const updateKey = Object.keys(updates)[0] as keyof typeof updates;
      const updateValue = updates[updateKey];

      let formattedValue;
      switch (updateKey) {
        case "name":
        case "status":
          formattedValue = String(updateValue);
          break;
        case "startDate":
        case "endDate":
          // Convert date to ISO string
          const date = new Date(updateValue as string);
          date.setUTCHours(12, 0, 0, 0);
          formattedValue = date.toISOString();
          break;
        case "budget":
        case "progress":
          formattedValue = Number(updateValue);
          break;
        default:
          formattedValue = updateValue;
      }

      const updatePayload = {
        [updateKey]: formattedValue,
        ...(updateKey === "members"
          ? {
              memberIds: Array.isArray(project.members) ? project.members : [],
            }
          : {}),
      };

      console.log("Sending update:", updatePayload);
      return axios.put(`/api/projects/${id}`, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
      setEditingCell(null);
    },
    onError: (error: unknown) => {
      // Handle validation errors from the server
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          const errorMessage = validationErrors
            .map((err) => `${err.path}: ${err.message}`)
            .join("\n");
          toast.error(errorMessage);
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Failed to update project");
      }
    },
  });

  const startEditing = (
    projectId: string,
    field: keyof Project,
    currentValue: string | number
  ) => {
    setEditingCell({ projectId, field, value: currentValue });
  };

  const saveEdit = () => {
    if (!editingCell) return;

    let value = editingCell.value;

    try {
      if (field === "budget" || field === "progress") {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error(`${field} must be a valid number`);
        }
        if (field === "progress" && (numValue < 0 || numValue > 100)) {
          throw new Error("Progress must be between 0 and 100");
        }
        if (field === "budget" && numValue < 0) {
          throw new Error("Budget cannot be negative");
        }
        value = numValue;
      } else if (field === "startDate" || field === "endDate") {
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid ${field}`);
        }

        // Set time to noon UTC to avoid timezone issues
        date.setUTCHours(12, 0, 0, 0);
        value = date.toISOString();

        if (field === "endDate" && project.startDate) {
          const startDate = new Date(project.startDate);
          startDate.setUTCHours(12, 0, 0, 0);
          if (!isNaN(startDate.getTime()) && date < startDate) {
            throw new Error("End date cannot be before start date");
          }
        }
        if (field === "startDate" && project.endDate) {
          const endDate = new Date(project.endDate);
          endDate.setUTCHours(12, 0, 0, 0);
          if (!isNaN(endDate.getTime()) && date > endDate) {
            throw new Error("Start date cannot be after end date");
          }
        }
      } else if (field === "name") {
        const strValue = String(value).trim();
        if (!strValue) {
          throw new Error("Name cannot be empty");
        }
        value = strValue;
      } else if (field === "status") {
        if (!Object.keys(statusColors).includes(String(value))) {
          throw new Error("Invalid status");
        }
      }

      const updates = {
        [editingCell.field]: value,
      };

      updateProjectMutation.mutate({ id: project.id, updates });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Invalid input");
      }
    }
  };
  const cancelEditing = () => {
    setEditingCell(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  if (isEditing) {
    const renderInput = () => {
      switch (field) {
        case "status":
          return (
            <Select
              value={editingCell.value as string}
              onValueChange={(value) =>
                setEditingCell({ ...editingCell, value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          );
        case "startDate":
        case "endDate":
          const dateValue = editingCell.value
            ? new Date(editingCell.value as string).toISOString().split("T")[0]
            : "";
          return (
            <Input
              type="date"
              value={dateValue}
              onChange={(e) =>
                setEditingCell({ ...editingCell, value: e.target.value })
              }
              className="w-32"
            />
          );
        case "progress":
          return (
            <Input
              type="number"
              min="0"
              max="100"
              value={editingCell.value}
              onChange={(e) =>
                setEditingCell({
                  ...editingCell,
                  value: Math.min(
                    100,
                    Math.max(0, parseInt(e.target.value) || 0)
                  ),
                })
              }
              className="w-32"
            />
          );
        case "budget":
          return (
            <Input
              type="number"
              min="0"
              value={editingCell.value}
              onChange={(e) =>
                setEditingCell({
                  ...editingCell,
                  value: parseInt(e.target.value) || 0,
                })
              }
              className="w-32"
            />
          );
        default:
          return (
            <Input
              value={editingCell.value}
              onChange={(e) =>
                setEditingCell({ ...editingCell, value: e.target.value })
              }
              className="w-32"
              type="text"
            />
          );
      }
    };

    return (
      <div className="flex items-center gap-2">
        {renderInput()}
        <Button size="sm" variant="ghost" onClick={saveEdit}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelEditing}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const renderDisplayValue = () => {
    switch (field) {
      case "status":
        return (
          <Badge className={statusColors[value as Project["status"]]}>
            {value}
          </Badge>
        );
      case "budget":
        return formatCurrency(value as number);
      case "name":
        return (
          <button
            onClick={() => (window.location.href = `/dashboard/${project.id}`)}
            className="text-left hover:underline font-medium"
          >
            {value}
          </button>
        );
      case "progress":
        return (
          <div className="flex items-center gap-2">
            <Progress value={value as number} className="w-16" />
            <span className="text-sm text-muted-foreground">{value}%</span>
          </div>
        );
      case "startDate":
      case "endDate":
        if (!value) return "-";
        const date = new Date(value as string);
        return !isNaN(date.getTime()) ? format(date, "MMM dd, yyyy") : "-";
      default:
        return value;
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span>{renderDisplayValue()}</span>
      {isEditable && (
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => startEditing(project.id, field, value)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default RenderEditableCell;
