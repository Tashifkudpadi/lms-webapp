// LearnersPage.tsx (refactored to match UsersPage UI)

"use client";

import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addStudent,
  updateStudent,
  deleteStudent,
} from "@/store/students";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, UserPlus, Download } from "lucide-react";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";

export default function LearnersPage() {
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { toast } = useToast();
  const { error } = useAppSelector((state) => state.studentsReducer);
  const pagination = useServerPagination<any>("/students", 10);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roll_number: "",
    mobile_number: "",
    enrollment_date: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      enrollment_date: formData.enrollment_date || null,
    };
    const result = await dispatch(addStudent(payload));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Student added", variant: "success" });
      setFormData({
        name: "",
        email: "",
        roll_number: "",
        mobile_number: "",
        enrollment_date: "",
      });
      setIsAddDialogOpen(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to add student", description: (result as any)?.payload || "Something went wrong", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const payload = {
      ...formData,
      enrollment_date: formData.enrollment_date || null,
    };
    const result = await dispatch(updateStudent({ studentId: editId, studentData: payload }));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Student updated", variant: "success" });
      setEditId(null);
      setIsEditDialogOpen(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to update student", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "Delete Student", description: "Are you sure you want to delete this student?", confirmLabel: "Delete", variant: "destructive" });
    if (ok) {
      const result = await dispatch(deleteStudent(id));
      if (result.meta.requestStatus === "fulfilled") {
        toast({ title: "Student deleted", variant: "success" });
      } else {
        toast({ title: "Failed to delete student", variant: "destructive" });
      }
      pagination.refetch();
    }
  };

  const handleEditClick = (student: any) => {
    setEditId(student.id);
    setFormData({
      name: student.name,
      email: student.email,
      roll_number: student.roll_number,
      mobile_number: student.mobile_number,
      enrollment_date: student.enrollment_date,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage all learners</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Input
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="roll_number"
                  placeholder="Roll Number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="mobile_number"
                  placeholder="Mobile Number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="enrollment_date"
                  type="date"
                  value={formData.enrollment_date}
                  onChange={handleChange}
                />
                <Button type="submit">Add Student</Button>
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
            placeholder="Search students..."
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
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map((s: any, idx: number) => (
              <TableRow key={s.id}>
                <TableCell>{pagination.startIndex + idx}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.roll_number}</TableCell>
                <TableCell>{s.mobile_number}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(s)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} onPageChange={pagination.setCurrentPage} itemLabel="students" />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              name="roll_number"
              placeholder="Roll Number"
              value={formData.roll_number}
              onChange={handleChange}
              required
            />
            <Input
              name="mobile_number"
              placeholder="Mobile Number"
              value={formData.mobile_number}
              onChange={handleChange}
              required
            />
            <Input
              name="enrollment_date"
              type="date"
              value={formData.enrollment_date}
              onChange={handleChange}
            />
            <Button type="submit">Update Student</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
