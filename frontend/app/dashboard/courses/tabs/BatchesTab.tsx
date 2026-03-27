"use client";

import React, { useState, useCallback } from "react";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";
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
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";

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
  const confirm = useConfirm();
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.authReducer);
  const isAdmin = user?.role === "admin";
  const pagination = useServerPagination<CourseBatch>(`/courses/${courseId}/batches`, 10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [courseBatchIds, setCourseBatchIds] = useState<Set<number>>(new Set());
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [addingBatch, setAddingBatch] = useState(false);
  const [error, setError] = useState("");

  const fetchAllBatches = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/batches");
      setAllBatches(res.data.items || []);
    } catch (e) {
      console.error("Failed to fetch all batches", e);
    }
  }, []);

  const fetchCourseBatchIds = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/courses/${courseId}/batches`);
      setCourseBatchIds(new Set((res.data.items || []).map((b: any) => b.id)));
    } catch (e) {
      console.error("Failed to fetch course batch IDs", e);
    }
  }, [courseId]);

  const handleRemoveBatch = async (batch: CourseBatch) => {
    const ok = await confirm({ title: "Remove Batch", description: `Remove batch "${batch.name}" from this course? This will not delete the batch itself, only unlink it from this course.`, confirmLabel: "Remove", variant: "destructive" });
    if (!ok) return;

    try {
      await axiosInstance.delete(`/courses/${courseId}/batches/${batch.id}`);
      toast({ title: "Batch removed", variant: "success" });
      pagination.refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.detail || "Failed to remove batch", variant: "destructive" });
    }
  };

  const handleAddBatch = async (batch: Batch) => {
    setError("");
    setAddingBatch(true);
    try {
      await axiosInstance.post(`/courses/${courseId}/batches/${batch.id}`);
      toast({ title: "Batch added", variant: "success" });
      pagination.refetch();
      setShowAddDialog(false);
      setBatchSearchQuery("");
    } catch (e: any) {
      toast({ title: "Failed to add batch", description: e?.response?.data?.detail || "Something went wrong", variant: "destructive" });
    } finally {
      setAddingBatch(false);
    }
  };

  const openAddDialog = () => {
    setError("");
    setBatchSearchQuery("");
    fetchAllBatches();
    fetchCourseBatchIds();
    setShowAddDialog(true);
  };

  // Filter batches for add dialog (exclude already linked)
  const availableBatches = allBatches.filter(
    (b) =>
      !courseBatchIds.has(b.id) &&
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-rose-500" />
          <h3 className="text-xl font-bold text-slate-900">
            Batches ({pagination.totalItems})
          </h3>
        </div>
        {isAdmin && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search batches by name..."
          value={pagination.search}
          onChange={(e) => pagination.setSearch(e.target.value)}
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
              {isAdmin && <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Loading batches...
                </TableCell>
              </TableRow>
            ) : pagination.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {pagination.search
                    ? "No batches match your search"
                    : "No batches linked to this course yet"}
                </TableCell>
              </TableRow>
            ) : (
              pagination.items.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className="font-medium text-slate-900">{batch.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="text-slate-700">{batch.num_learners}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-rose-500" />
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
                  {isAdmin && (
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
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} onPageChange={pagination.setCurrentPage} itemLabel="batches" />

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
                        className="text-rose-500 border-rose-200 hover:bg-rose-50"
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
