"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Check, X, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TUser = {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "ProjectManager" | "Developer" | null;
};

const roleColors: Record<NonNullable<TUser["role"]>, string> = {
  Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  ProjectManager:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Developer:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const getUsers = async (): Promise<TUser[]> => {
  const res = await fetch(`/api/user`);
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await res.json();
  return data.users;
};

const updateUserRole = async ({
  id,
  role,
}: {
  id: string;
  role: TUser["role"];
}) => {
  const res = await fetch(`/api/user/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to parse error response" }));
    throw new Error(errorData.message || "Failed to update user role");
  }
  return res.json();
};

const deleteUser = async (id: string) => {
  const res = await fetch(`/api/user/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to parse error response" }));
    throw new Error(errorData.message || "Failed to delete user");
  }
  return res.json();
};

function UsersTable() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<TUser["role"] | null>(null);

  const router = useRouter();

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery<TUser[]>({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const updateMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      toast.success("User role updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUserId(null);
      setSelectedRole(null);
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error.message}`);
    },
  });

  const handleEditClick = (user: TUser) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const handleCancelClick = () => {
    setEditingUserId(null);
    setSelectedRole(null);
  };

  const handleSaveClick = () => {
    if (editingUserId) {
      updateMutation.mutate({ id: editingUserId, role: selectedRole });
    }
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (isError) {
    return <div>Error fetching users.</div>;
  }

  return (
    <>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <Select
                      value={selectedRole ?? ""}
                      onValueChange={(value) =>
                        setSelectedRole(
                          value === "null" ? null : (value as TUser["role"]),
                        )
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="ProjectManager">
                          Project Manager
                        </SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="null">No Role</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    user.role && (
                      <Badge className={roleColors[user.role]}>
                        {user.role}
                      </Badge>
                    )
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingUserId === user.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveClick}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelClick}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteClick(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
export default UsersTable;

