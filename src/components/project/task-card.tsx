import { Task } from "@/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  canUpdateStatus?: boolean;
}

export function TaskCard({
  task,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  canUpdateStatus = false,
}: TaskCardProps) {
  return (
    <Card className={`${isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          {canUpdateStatus ? (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
              className="border rounded p-1 text-sm"
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          ) : (
            <Badge>{task.status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
