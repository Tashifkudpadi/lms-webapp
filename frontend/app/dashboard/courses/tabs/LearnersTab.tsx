"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, Search, Users } from "lucide-react";
import axiosInstance from "@/utils/axios";

type Learner = {
  id: number;
  name: string;
  email: string;
  roll_number: string | null;
  mobile_number: string | null;
  enrollment_date: string | null;
  batch_id: number | null;
  batch_name: string | null;
  source: "direct" | "batch";
};

type Student = {
  id: number;
  name: string;
  email: string;
  roll_number: string | null;
  mobile_number: string | null;
};

export default function LearnersTab({ courseId }: { courseId: string | number }) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [error, setError] = useState("");

  const fetchLearners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/courses/${courseId}/learners`);
      setLearners(res.data || []);
    } catch (e) {
      console.error("Failed to fetch learners", e);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/students");
      setAllStudents(res.data || []);
    } catch (e) {
      console.error("Failed to fetch students", e);
    }
  }, []);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  const handleRemoveLearner = async (learner: Learner) => {
    const message =
      learner.source === "batch"
        ? `Remove "${learner.name}" from batch "${learner.batch_name}"? This will remove them from all courses linked to this batch.`
        : `Remove "${learner.name}" from this course?`;

    const ok = window.confirm(message);
    if (!ok) return;

    try {
      const params = learner.batch_id ? `?batch_id=${learner.batch_id}` : "";
      await axiosInstance.delete(
        `/courses/${courseId}/learners/${learner.id}${params}`
      );
      await fetchLearners();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to remove learner");
    }
  };

  const handleAddStudent = async (student: Student) => {
    setError("");
    setAddingStudent(true);
    try {
      await axiosInstance.post(`/courses/${courseId}/learners/${student.id}`);
      await fetchLearners();
      setShowAddDialog(false);
      setStudentSearchQuery("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
  };

  const openAddDialog = () => {
    setError("");
    setStudentSearchQuery("");
    fetchAllStudents();
    setShowAddDialog(true);
  };

  // Filter learners by search query
  const filteredLearners = learners.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.roll_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.batch_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter students for add dialog (exclude already added)
  const learnerIds = new Set(learners.map((l) => l.id));
  const availableStudents = allStudents.filter(
    (s) =>
      !learnerIds.has(s.id) &&
      (s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">
            Learners ({learners.length})
          </h3>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Learner
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, email, roll number, or batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-white">
              <TableHead className="font-semibold text-slate-700">Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Batch</TableHead>
              <TableHead className="font-semibold text-slate-700">Roll Number</TableHead>
              <TableHead className="font-semibold text-slate-700">Mobile No.</TableHead>
              <TableHead className="font-semibold text-slate-700">Enrollment Date</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Loading learners...
                </TableCell>
              </TableRow>
            ) : filteredLearners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {searchQuery
                    ? "No learners match your search"
                    : "No learners in this course yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLearners.map((learner) => (
                <TableRow key={`${learner.id}-${learner.source}`} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{learner.name}</span>
                      <span className="text-sm text-slate-500">{learner.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {learner.source === "batch" ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {learner.batch_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">
                        Direct
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {learner.roll_number || "-"}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {learner.mobile_number || "-"}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {formatDate(learner.enrollment_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLearner(learner)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Learner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Learner to Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students by name or email..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {availableStudents.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  {studentSearchQuery
                    ? "No students match your search"
                    : "All students are already in this course"}
                </div>
              ) : (
                <div className="divide-y">
                  {availableStudents.slice(0, 10).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {student.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {student.email}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addingStudent}
                        onClick={() => handleAddStudent(student)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {availableStudents.length > 10 && (
                    <div className="text-center py-2 text-sm text-slate-500">
                      Showing 10 of {availableStudents.length} students. Use search to narrow down.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
