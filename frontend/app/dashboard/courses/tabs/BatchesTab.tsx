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
import { Trash2, Plus, Search, Users, GraduationCap, Calendar } from "lucide-react";
import axiosInstance from "@/utils/axios";

type CourseBatch = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  num_learners: number;
  num_faculties: number;
};

type Batch = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

export default function BatchesTab({ courseId }: { courseId: string | number }) {
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [addingBatch, setAddingBatch] = useState(false);
  const [error, setError] = useState("");

  const fetchCourseBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/courses/${courseId}/batches`);
      setBatches(res.data || []);
    } catch (e) {
      console.error("Failed to fetch course batches", e);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchAllBatches = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/batches");
      setAllBatches(res.data || []);
    } catch (e) {
      console.error("Failed to fetch all batches", e);
    }
  }, []);

  useEffect(() => {
    fetchCourseBatches();
  }, [fetchCourseBatches]);

  const handleRemoveBatch = async (batch: CourseBatch) => {
    const ok = window.confirm(
      `Remove batch "${batch.name}" from this course? This will not delete the batch itself, only unlink it from this course.`
    );
    if (!ok) return;

    try {
      await axiosInstance.delete(`/courses/${courseId}/batches/${batch.id}`);
      await fetchCourseBatches();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to remove batch");
    }
  };

  const handleAddBatch = async (batch: Batch) => {
    setError("");
    setAddingBatch(true);
    try {
      await axiosInstance.post(`/courses/${courseId}/batches/${batch.id}`);
      await fetchCourseBatches();
      setShowAddDialog(false);
      setBatchSearchQuery("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add batch");
    } finally {
      setAddingBatch(false);
    }
  };

  const openAddDialog = () => {
    setError("");
    setBatchSearchQuery("");
    fetchAllBatches();
    setShowAddDialog(true);
  };

  // Filter course batches by search query
  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter batches for add dialog (exclude already linked)
  const linkedBatchIds = new Set(batches.map((b) => b.id));
  const availableBatches = allBatches.filter(
    (b) =>
      !linkedBatchIds.has(b.id) &&
      b.name.toLowerCase().includes(batchSearchQuery.toLowerCase())
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

  // Calculate total learners across all batches
  const totalLearners = batches.reduce((sum, b) => sum + b.num_learners, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-bold text-slate-900">
            Batches ({batches.length})
          </h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 ml-2">
            {totalLearners} Total Learners
          </Badge>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search batches by name..."
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
              <TableHead className="font-semibold text-slate-700">Batch Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Learners</TableHead>
              <TableHead className="font-semibold text-slate-700">Faculties</TableHead>
              <TableHead className="font-semibold text-slate-700">Start Date</TableHead>
              <TableHead className="font-semibold text-slate-700">End Date</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Loading batches...
                </TableCell>
              </TableRow>
            ) : filteredBatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {searchQuery
                    ? "No batches match your search"
                    : "No batches linked to this course yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className="font-medium text-slate-900">{batch.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-slate-700">{batch.num_learners}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span className="text-slate-700">{batch.num_faculties}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-slate-700">{formatDate(batch.start_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-slate-700">{formatDate(batch.end_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBatch(batch)}
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

      {/* Add Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Batch to Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search batches by name..."
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {availableBatches.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  {batchSearchQuery
                    ? "No batches match your search"
                    : "All batches are already linked to this course"}
                </div>
              ) : (
                <div className="divide-y">
                  {availableBatches.slice(0, 10).map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {batch.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addingBatch}
                        onClick={() => handleAddBatch(batch)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {availableBatches.length > 10 && (
                    <div className="text-center py-2 text-sm text-slate-500">
                      Showing 10 of {availableBatches.length} batches. Use search to narrow down.
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
