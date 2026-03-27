"use client";

import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addUser,
  updateUser,
  deleteUser,
  clearError,
} from "@/store/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Search, UserPlus, Download } from "lucide-react";
import { User } from "@/store/types";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { toast } = useToast();
  const { loading, error } = useAppSelector(
    (state) => state.userReducer
  );
  const pagination = useServerPagination<any>("/users", 10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    password: "",
    confirm_password: "",
  });
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });

  // Handle form input changes for add user
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form input changes for edit user
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Handle add user form submission
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(addUser(formData));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "User added", variant: "success" });
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        password: "",
        confirm_password: "",
      });
      setIsAddDialogOpen(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to add user", description: (result as any)?.payload || "Something went wrong", variant: "destructive" });
    }
  };

  // Handle edit user form submission
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUserId) return;
    dispatch(clearError());
    const result = await dispatch(updateUser({ userId: editUserId, userData: editFormData }));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "User updated", variant: "success" });
      setEditFormData({
        first_name: "",
        last_name: "",
        email: "",
        role: "",
      });
      setIsEditDialogOpen(false);
      setEditUserId(null);
      pagination.refetch();
    } else {
      toast({ title: "Failed to update user", description: (result as any)?.payload || "Something went wrong", variant: "destructive" });
    }
  };

  // Handle delete user
  const handleDelete = async (userId: number) => {
    const ok = await confirm({ title: "Delete User", description: "Are you sure you want to delete this user?", confirmLabel: "Delete", variant: "destructive" });
    if (!ok) return;
    dispatch(clearError());
    const result = await dispatch(deleteUser(userId));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "User deleted", variant: "success" });
    } else {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
    pagination.refetch();
  };

  // Handle edit user click
  const handleEditClick = (user: User) => {
    setEditUserId(user.id);
    setEditFormData({
      first_name: user?.name?.split(" ")[0] || "",
      last_name: user.name?.split(" ").slice(1).join(" ") || "",
      email: user.email,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    name="role"
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Adding user...
                    </div>
                  ) : (
                    "Add User"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="w-full pl-8"
            value={pagination.search}
            onChange={(e) => pagination.setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pagination.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              pagination.items.map((user: any, index) => (
                <TableRow key={user.id}>
                  <TableCell>{pagination.startIndex + index}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_active
                      ? new Date(user.last_active).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} onPageChange={pagination.setCurrentPage} itemLabel="users" />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditInputChange}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditInputChange}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email Address</Label>
              <Input
                id="edit_email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select
                name="role"
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Updating user...
                </div>
              ) : (
                "Update User"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
