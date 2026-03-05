"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addZoomClass, deleteZoomClass } from "@/store/zoomClasses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Search, Video, ExternalLink } from "lucide-react";
import axiosInstance from "@/utils/axios";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";
import { formatDate } from "@/utils/formatDate";

type SubjectOption = { id: number; name: string };
type FacultyOption = { id: number; name: string };

export default function ClassesTab({ courseId }: { courseId: string | number }) {
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { toast } = useToast();
  const { error } = useAppSelector((state) => state.zoomClassesReducer);
  const { user } = useAppSelector((state) => state.authReducer);
  const isAdmin = user?.role === "admin";
  const pagination = useServerPagination<any>(
    `/zoom-classes?course_id=${courseId}`,
    10
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    subject_id: "",
    faculty_id: "",
    class_date: "",
    start_time: "",
    end_time: "",
    zoom_url: "",
  });

  const fetchCourseOptions = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/courses/${courseId}`);
      const course = res.data;
      setSubjects(
        (course.subjects || []).map((s: any) => ({ id: s.id, name: s.name }))
      );
      setFaculties(
        (course.faculty_ids || []).map((id: number) => ({ id, name: `Faculty ${id}` }))
      );
      // Try to get faculty names from faculties endpoint
      if (course.faculty_ids?.length) {
        const facRes = await axiosInstance.get("/faculties?limit=0");
        const allFaculties = facRes.data.items || [];
        const courseFacultyIds = new Set(course.faculty_ids);
        setFaculties(
          allFaculties
            .filter((f: any) => courseFacultyIds.has(f.id))
            .map((f: any) => ({ id: f.id, name: f.name }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch course options", e);
    }
  }, [courseId]);

  useEffect(() => {
    if (showAddDialog) {
      fetchCourseOptions();
    }
  }, [showAddDialog, fetchCourseOptions]);

  const resetForm = () => {
    setFormData({
      name: "",
      subject_id: "",
      faculty_id: "",
      class_date: "",
      start_time: "",
      end_time: "",
      zoom_url: "",
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      course_id: Number(courseId),
      subject_id: formData.subject_id ? Number(formData.subject_id) : null,
      faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null,
      class_date: formData.class_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      zoom_url: formData.zoom_url,
    };
    const result = await dispatch(addZoomClass(payload));
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Class created", variant: "success" });
      resetForm();
      setShowAddDialog(false);
      pagination.refetch();
    } else {
      toast({ title: "Failed to create class", description: (result as any)?.payload || "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete Class",
      description: "Are you sure you want to delete this class?",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (ok) {
      const result = await dispatch(deleteZoomClass(id));
      if (result.meta.requestStatus === "fulfilled") {
        toast({ title: "Class deleted", variant: "success" });
      } else {
        toast({ title: "Failed to delete class", variant: "destructive" });
      }
      pagination.refetch();
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    // Time comes as "HH:MM:SS", show "HH:MM"
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">
            Classes ({pagination.totalItems})
          </h3>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search classes..."
          className="pl-8"
          value={pagination.search}
          onChange={(e) => pagination.setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {!pagination.loading && pagination.totalItems === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No classes yet
        </p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Zoom Link</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.subject_name || "-"}</TableCell>
                    <TableCell>{cls.faculty_name || "-"}</TableCell>
                    <TableCell>{formatDate(cls.class_date)}</TableCell>
                    <TableCell>
                      {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={cls.zoom_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Join <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cls.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.setCurrentPage}
            itemLabel="classes"
          />
        </>
      )}

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. English Grammar - Session 1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, subject_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select
                  value={formData.faculty_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, faculty_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.class_date}
                onChange={(e) =>
                  setFormData({ ...formData, class_date: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zoom URL</Label>
              <Input
                type="url"
                value={formData.zoom_url}
                onChange={(e) =>
                  setFormData({ ...formData, zoom_url: e.target.value })
                }
                placeholder="https://zoom.us/j/..."
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Create Class
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
