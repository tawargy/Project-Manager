export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "Not Started" | "In Progress" | "Completed" | "Cancelled";
  startDate?: string;
  endDate?: string;
  progress: number; // 0-100
  budget?: number;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  tasks?: string[];
}

export interface ProjectFilters {
  status?: Project["status"][];
  // priority?: Project["priority"][]
  assignedUser?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ProjectSort {
  field: keyof Project;
  direction: "asc" | "desc";
}
