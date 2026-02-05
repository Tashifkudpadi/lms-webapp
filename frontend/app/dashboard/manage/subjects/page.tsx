// SubjectsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
} from "@/store/subjects";
import { fetchFaculties } from "@/store/faculties";
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
import { MoreHorizontal, Search, Plus, Download } from "lucide-react";

interface Subject {
  id: number;
  name: string;
  code: string;
  faculty_ids: number[];
}

export default function SubjectsPage() {
  const dispatch = useAppDispatch();
  const { subjects, error } = useAppSelector((state) => state.subjectsReducer);
  const { faculty } = useAppSelector((state) => state.facultyReducer);

  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    faculty_ids: [] as number[],
  });

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchFaculties());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFacultyChange = (facultyId: number) => {
    setFormData((prev) => ({
      ...prev,
      faculty_ids: prev.faculty_ids.includes(facultyId)
        ? prev.faculty_ids.filter((id) => id !== facultyId)
        : [...prev.faculty_ids, facultyId],
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(addSubject(formData));
    setFormData({
      name: "",
      code: "",
      faculty_ids: [],
    });
    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    await dispatch(
      updateSubject({
        subjectId: editId,
        subjectData: formData,
      })
    );
    setEditId(null);
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      dispatch(deleteSubject(id));
    }
  };

  const handleEditClick = (subject: Subject) => {
    setEditId(subject.id);
    setFormData({
      name: subject.name,
      code: subject.code,
      faculty_ids: subject.faculty_ids,
    });
    setIsEditDialogOpen(true);
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const getFacultyNames = (facultyIds: number[]) => {
    return faculty
      .filter((f) => facultyIds.includes(f.id))
      .map((f) => f.name)
      .join(", ");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">
            Manage all subjects and faculty assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Input
                  name="name"
                  placeholder="Subject Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="code"
                  placeholder="Subject Code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
                <div className="space-y-2">
                  <Label>Assign Faculty</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {faculty.map((facultyMember) => (
                      <label
                        key={facultyMember.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.faculty_ids.includes(
                            facultyMember.id
                          )}
                          onChange={() => handleFacultyChange(facultyMember.id)}
                          className="rounded"
                        />
                        <span>{facultyMember.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit">Add Subject</Button>
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
            placeholder="Search subjects..."
            className="w-full pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((subject, idx) => (
              <TableRow key={subject.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{subject.code}</Badge>
                </TableCell>
                <TableCell>
                  {getFacultyNames(subject.faculty_ids) || "No Faculty"}
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
                        onClick={() => handleEditClick(subject)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(subject.id)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Subject Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              name="code"
              placeholder="Subject Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <div className="space-y-2">
              <Label>Assign Faculty</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {faculty.map((facultyMember) => (
                  <label
                    key={facultyMember.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.faculty_ids.includes(facultyMember.id)}
                      onChange={() => handleFacultyChange(facultyMember.id)}
                      className="rounded"
                    />
                    <span>{facultyMember.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit">Update Subject</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
