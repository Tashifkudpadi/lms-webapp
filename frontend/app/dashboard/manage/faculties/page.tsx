// FacultiesPage.tsx
"use client";

import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addFaculty,
  updateFaculty,
  deleteFaculty,
} from "@/store/faculties";
import { fetchSubjects } from "@/store/subjects";
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

interface Faculty {
  id: number;
  name: string;
  email: string;
  mobile_number: string;
  subject_ids: number[];
}

export default function FacultiesPage() {
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { toast } = useToast();
  const { error } = useAppSelector((state) => state.facultyReducer);
  const { subjects } = useAppSelector((state) => state.subjectsReducer);
  const pagination = useServerPagination<any>("/faculties", 10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    subject_ids: [] as number[],
  });

  useEffect(() => {
    dispatch(fetchSubjects());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubjectChange = (subjectId: number) => {
    setFormData((prev) => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter((id) => id !== subjectId)
        : [...prev.subject_ids, subjectId],
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(addFaculty(formData));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Faculty added", variant: "success" });
      setFormData({
        name: "",
        email: "",
        mobile_number: "",
        subject_ids: [],
      });
      setIsAddDialogOpen(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to add faculty", description: (result as any)?.payload || "Something went wrong", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const result = await dispatch(
      updateFaculty({
        facultyId: editId,
        facultyData: formData,
      })
    );
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Faculty updated", variant: "success" });
      setEditId(null);
      setIsEditDialogOpen(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to update faculty", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "Delete Faculty", description: "Are you sure you want to delete this faculty?", confirmLabel: "Delete", variant: "destructive" });
    if (ok) {
      const result = await dispatch(deleteFaculty(id));
      if (result.meta.requestStatus === "fulfilled") {
        toast({ title: "Faculty deleted", variant: "success" });
      } else {
        toast({ title: "Failed to delete faculty", variant: "destructive" });
      }
      pagination.refetch();
    }
  };

  const handleEditClick = (faculty: Faculty) => {
    setEditId(faculty.id);
    setFormData({
      name: faculty.name,
      email: faculty.email,
      mobile_number: faculty.mobile_number,
      subject_ids: faculty.subject_ids,
    });
    setIsEditDialogOpen(true);
  };

  const getSubjectNames = (subjectIds: number[]) => {
    return subjects
      .filter((s) => subjectIds.includes(s.id))
      .map((s) => s.name)
      .join(", ");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty</h1>
          <p className="text-muted-foreground">Manage all faculty members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Faculty</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Input
                  name="name"
                  placeholder="Name"
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
                  name="mobile_number"
                  placeholder="Mobile Number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  required
                />
                <div className="space-y-2">
                  <Label>Assign Subjects</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.subject_ids.includes(subject.id)}
                          onChange={() => handleSubjectChange(subject.id)}
                          className="rounded"
                        />
                        <span>
                          {subject.name} ({subject.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit">Add Faculty</Button>
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
            placeholder="Search faculty..."
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
              <TableHead>Mobile</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map((facultyMember: any, idx: number) => (
              <TableRow key={facultyMember.id}>
                <TableCell>{pagination.startIndex + idx}</TableCell>
                <TableCell>{facultyMember.name}</TableCell>
                <TableCell>{facultyMember.email}</TableCell>
                <TableCell>{facultyMember.mobile_number}</TableCell>
                <TableCell>
                  {getSubjectNames(facultyMember.subject_ids) || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(facultyMember)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(facultyMember.id)}
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
      <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} onPageChange={pagination.setCurrentPage} itemLabel="faculties" />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Input
              name="name"
              placeholder="Name"
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
              name="mobile_number"
              placeholder="Mobile Number"
              value={formData.mobile_number}
              onChange={handleChange}
              required
            />
            <div className="space-y-2">
              <Label>Assign Subjects</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={() => handleSubjectChange(subject.id)}
                      className="rounded"
                    />
                    <span>
                      {subject.name} ({subject.code})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit">Update Faculty</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
