import { BulkTaskUpdate } from "@/types/task";

interface BulkActionsProps {
  selectedTasks: string[];
  onBulkUpdate: (update: BulkTaskUpdate) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  showStatusUpdate?: boolean;
  showDelete?: boolean;
}

export function BulkActions({
  selectedTasks,
  onBulkUpdate,
  onBulkDelete,
  onClearSelection,
  showStatusUpdate = false,
  showDelete = false,
}: BulkActionsProps) {
  if (selectedTasks.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <span className="text-sm">{selectedTasks.length} tasks selected</span>

      {showStatusUpdate && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkUpdate({ status: "In Progress" })}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark In Progress
          </button>
          <button
            onClick={() => onBulkUpdate({ status: "Done" })}
            className="text-sm text-green-600 hover:underline"
          >
            Mark Done
          </button>
        </div>
      )}

      {showDelete && (
        <button
          onClick={onBulkDelete}
          className="text-sm text-destructive hover:underline"
        >
          Delete
        </button>
      )}

      <button
        onClick={onClearSelection}
        className="text-sm text-muted-foreground hover:underline ml-auto"
      >
        Clear selection
      </button>
    </div>
  );
}
