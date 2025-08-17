export interface Task {
  id: string;
  title: string;
  description: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High";
  startDate: string;
  endDate: string;
  assignedTo: string[];
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
}

export interface TaskSort {
  field: keyof Task;
  direction: "asc" | "desc";
}

export interface BulkTaskUpdate {
  status?: Task["status"];
  priority?: Task["priority"];
  assignedTo?: string[];
}
