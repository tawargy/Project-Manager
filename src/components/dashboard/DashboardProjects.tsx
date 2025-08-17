"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import type { Project, ProjectSort } from "@/types/project";
import RenderEditableCell from "./ReanderEditableCell";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectForm from "./ProjectForm";

function DashboardProjects() {
  const { data: session } = useSession();
  const [sort, setSort] = useState<ProjectSort | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Project["status"] | "all" | undefined
  >(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(
    undefined,
  );
  const [showProjectForm, setShowProjectForm] = useState(false);
  const itemsPerPage = 5;

  const canEdit =
    session?.user?.role === "Admin" || session?.user?.role === "ProjectManager";

  const handleSort = (field: keyof Project) => {
    const direction =
      sort?.field === field && sort?.direction === "asc" ? "desc" : "asc";
    setSort({ field, direction });
  };

  const getSortIcon = (field: keyof Project) => {
    if (sort?.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const fetchProjects = async () => {
    const { data } = await axios.get("/api/projects");
    return data.projects;
  };
  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isError) {
    return (
      <div className="rounded-md border border-destructive p-4">
        <div className="flex items-center gap-2 text-destructive">
          <span className="font-semibold">Error:</span>
          <span>Failed to load projects. Please try again later.</span>
        </div>
      </div>
    );
  }

  // Filter and sort projects
  const filteredAndSortedProjects = [...projects]
    .filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !statusFilter ||
        statusFilter === "all" ||
        project.status === statusFilter;

      // const matchesMember =
      //   !memberFilter ||
      //   memberFilter === "all" ||
      //   project.members.some((member) => member.id === memberFilter);
      //
      return matchesSearch && matchesStatus; //&& matchesMember;
    })
    .sort((a, b) => {
      if (!sort) return 0;

      const { field, direction } = sort;
      const aValue = a[field];
      const bValue = b[field];

      if (field === "startDate" || field === "endDate") {
        // Handle potentially undefined dates
        if (!aValue || !bValue) return 0;
        return direction === "asc"
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredAndSortedProjects.slice(
    startIndex,
    endIndex,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 md:max-w-sm">
          <Input
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter || undefined}
            onValueChange={(value: Project["status"] | "all") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* <Select */}
          {/*   value={memberFilter || undefined} */}
          {/*   onValueChange={(value: string) => setMemberFilter(value)} */}
          {/* > */}
          {/*   <SelectTrigger className="w-[180px]"> */}
          {/*     <SelectValue placeholder="Filter by member" /> */}
          {/*   </SelectTrigger> */}
          {/*   <SelectContent> */}
          {/*     <SelectItem value="all">All Members</SelectItem> */}
          {/*     {(() => { */}
          {/*       interface ProjectMember { */}
          {/*         id: string; */}
          {/*         name: string; */}
          {/*         email: string; */}
          {/*         role: string; */}
          {/*       } */}
          {/**/}
          {/*       // Get all members */}
          {/*       const allMembers = projects.flatMap( */}
          {/*         (project: Project) => project.members */}
          {/*       ); */}
          {/**/}
          {/*       // Create unique member entries based on ID */}
          {/*       const uniqueMembers = Array.from( */}
          {/*         new Map( */}
          {/*           allMembers.map((member: ProjectMember) => [ */}
          {/*             member.id, */}
          {/*             member, */}
          {/*           ]) */}
          {/*         ) */}
          {/*       ).map(([, member]) => member as ProjectMember); */}
          {/**/}
          {/*       // Sort by name and create items */}
          {/*       return uniqueMembers */}
          {/*         .sort((a: ProjectMember, b: ProjectMember) => */}
          {/*           a.name.localeCompare(b.name) */}
          {/*         ) */}
          {/*         .map((member: ProjectMember) => ( */}
          {/*           <SelectItem key={member.id} value={member.id}> */}
          {/*             {member.name} */}
          {/*           </SelectItem> */}
          {/*         )); */}
          {/*     })()} */}
          {/*   </SelectContent> */}
          {/* </Select> */}

          <Button variant="default" onClick={() => setShowProjectForm(true)}>
            Create Project
          </Button>
          <ProjectForm
            isOpen={showProjectForm}
            onClose={() => setShowProjectForm(false)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold"
                >
                  Name {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-auto p-0 font-semibold"
                >
                  Status {getSortIcon("status")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("startDate")}
                  className="h-auto p-0 font-semibold"
                >
                  Start Date {getSortIcon("startDate")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("endDate")}
                  className="h-auto p-0 font-semibold"
                >
                  End Date {getSortIcon("endDate")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("progress")}
                  className="h-auto p-0 font-semibold"
                >
                  Progress {getSortIcon("progress")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("budget")}
                  className="h-auto p-0 font-semibold"
                >
                  Budget {getSortIcon("budget")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-6 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                  </TableRow>
                ))
              : paginatedProjects.map((project: Project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <RenderEditableCell
                        project={project}
                        field="name"
                        value={project.name}
                        isEditable={canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <RenderEditableCell
                        project={project}
                        field="status"
                        value={project.status}
                        isEditable={canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <RenderEditableCell
                        project={project}
                        field="startDate"
                        value={
                          project.startDate
                            ? format(new Date(project.startDate), "yyyy-MM-dd")
                            : ""
                        }
                        isEditable={canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <RenderEditableCell
                        project={project}
                        field="endDate"
                        value={
                          project.endDate
                            ? format(new Date(project.endDate), "yyyy-MM-dd")
                            : ""
                        }
                        isEditable={canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <RenderEditableCell
                        project={project}
                        field="progress"
                        value={project.progress.toString()}
                        isEditable={canEdit}
                      />
                    </TableCell>
                    <TableCell>
                      <RenderEditableCell
                        project={project}
                        field="budget"
                        value={project.budget?.toString() ?? ""}
                        isEditable={canEdit}
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={`page-${pageNum}`}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
export default DashboardProjects;
