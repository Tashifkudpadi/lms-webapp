"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Calendar,
  FileText,
  Plus,
  Search,
  Trash2,
  GraduationCap,
  BookOpen,
  FolderPlus,
  Play,
  CheckCircle2,
  Award,
  AlertCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import {
  fetchSubCategories,
  createTest,
  createSubCategory,
  deleteTest,
  ExamType,
  TestCategory,
  TestStatus,
  ActivationMethod,
  TestListItem,
} from "@/store/tests";
import { fetchBatches } from "@/store/batches";
import { fetchCourses } from "@/store/courses";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { fetchSubjects } from "@/store/subjects";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";
import { useToast } from "@/hooks/use-toast";

export default function TestsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <TestsPage />
    </Suspense>
  );
}

function TestsPage() {
  const confirm = useConfirm();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("createForCourse");
  const testsState = useSelector((state: RootState) => state.testsReducer);
  const subCategories = testsState?.subCategories || [];
  const user = useSelector((state: RootState) => state.authReducer?.user);
  const userRole = user?.role || "student";
  const batches = useSelector(
    (state: RootState) => state.batchesReducer?.batches || [],
  );
  const courses = useSelector(
    (state: RootState) => state.coursesReducer?.list || [],
  );
  const students = useSelector(
    (state: RootState) => state.studentsReducer?.students || [],
  );
  const faculties = useSelector(
    (state: RootState) => state.facultyReducer?.faculty || [],
  );
  const subjects = useSelector(
    (state: RootState) => state.subjectsReducer?.subjects || [],
  );

  const [selectedTab, setSelectedTab] = useState<"ALL" | ExamType>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>(
    TestCategory.PRELIMS,
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );
  const selectedExamType = selectedTab === "ALL" ? null : selectedTab;

  // Dialog states
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);
  const [attemptedDialog, setAttemptedDialog] = useState<{
    open: boolean;
    testName: string;
    status: string;
  }>({ open: false, testName: "", status: "" });

  // Form states
  const [newTest, setNewTest] = useState({
    test_name: "",
    description: "",
    exam_type: ExamType.UPSC,
    category: TestCategory.PRELIMS,
    sub_category_id: null as number | null,
    subject_id: null as number | null,
    activation_method: ActivationMethod.MANUAL,
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 40,
    negative_marking: 0.25,
    start_datetime: "",
    end_datetime: "",
    instructions: "",
    batch_ids: [] as number[],
    student_ids: [] as number[],
    faculty_ids: [] as number[],
    course_ids: [] as number[],
  });

  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    description: "",
    exam_type: ExamType.UPSC,
  });

  // Build URL with current filters for server-side pagination
  const testsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedExamType) {
      params.set("exam_type", selectedExamType);
      params.set("category", selectedCategory);
      if (selectedSubCategory) params.set("sub_category_id", selectedSubCategory.toString());
    }
    const qs = params.toString();
    return `/tests/my-tests${qs ? `?${qs}` : ""}`;
  }, [selectedExamType, selectedCategory, selectedSubCategory]);

  const testsPagination = useServerPagination<any>(testsUrl, 9);

  // Fetch sub-categories on mount
  useEffect(() => {
    dispatch(fetchSubCategories());
  }, [dispatch]);

  // Auto-open create dialog if navigated from course tab
  useEffect(() => {
    if (preselectedCourseId) {
      const courseId = parseInt(preselectedCourseId);
      setNewTest((prev) => ({
        ...prev,
        course_ids: [courseId],
      }));
      setShowCreateTest(true);
    }
  }, [preselectedCourseId]);

  // Fetch batches, courses, students, and faculties when create test dialog opens
  useEffect(() => {
    if (showCreateTest) {
      dispatch(fetchBatches());
      dispatch(fetchCourses());
      dispatch(fetchStudents());
      dispatch(fetchFaculties());
      dispatch(fetchSubjects());
    }
  }, [showCreateTest, dispatch]);

  // Filter sub-categories by exam type (for page tabs)
  const filteredSubCategories = subCategories.filter(
    (sc) => sc.exam_type === selectedExamType,
  );

  // Filter sub-categories for the dialog (uses newTest.exam_type)
  const dialogSubCategories = subCategories.filter(
    (sc) => sc.exam_type === newTest.exam_type,
  );

  // Convert datetime-local value to ISO string with timezone offset
  const toISOWithTimezone = (dt: string): string | undefined => {
    if (!dt) return undefined;
    const d = new Date(dt);
    return d.toISOString();
  };

  const handleCreateTest = async () => {
    try {
      const payload: any = {
        ...newTest,
        sub_category_id: newTest.sub_category_id ?? undefined,
        subject_id: newTest.subject_id ?? undefined,
        start_datetime: toISOWithTimezone(newTest.start_datetime),
        end_datetime: toISOWithTimezone(newTest.end_datetime),
      };
      await dispatch(createTest(payload)).unwrap();
      setShowCreateTest(false);
      setNewTest({
        test_name: "",
        description: "",
        exam_type: selectedExamType || ExamType.UPSC,
        category: selectedTab === "ALL" ? TestCategory.PRELIMS : selectedCategory,
        sub_category_id: null,
        subject_id: null,
        activation_method: ActivationMethod.MANUAL,
        duration_minutes: 60,
        total_marks: 100,
        passing_marks: 40,
        negative_marking: 0.25,
        start_datetime: "",
        end_datetime: "",
        instructions: "",
        batch_ids: [],
        student_ids: [],
        faculty_ids: [],
        course_ids: [],
      });
      testsPagination.refetch();
      toast({ title: "Test created successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to create test", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      await dispatch(createSubCategory(newSubCategory)).unwrap();
      setShowCreateSubCategory(false);
      setNewSubCategory({
        name: "",
        description: "",
        exam_type: selectedExamType || ExamType.UPSC,
      });
      toast({ title: "Sub-category created successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to create sub-category", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleDeleteTest = async (testId: number) => {
    const ok = await confirm({ title: "Delete Test", description: "Are you sure you want to delete this test?", confirmLabel: "Delete", variant: "destructive" });
    if (ok) {
      try {
        await dispatch(deleteTest(testId)).unwrap();
        testsPagination.refetch();
        toast({ title: "Test deleted successfully", variant: "success" });
      } catch (err: any) {
        toast({ title: "Failed to delete test", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case TestStatus.DRAFT:
        return <Badge className="bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200">Draft</Badge>;
      case TestStatus.PUBLISHED:
        return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200">Published</Badge>;
      case TestStatus.ARCHIVED:
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openCreateTestDialog = () => {
    setNewTest({
      ...newTest,
      exam_type: selectedExamType || ExamType.UPSC,
      category: selectedTab === "ALL" ? TestCategory.PRELIMS : selectedCategory,
      sub_category_id: selectedTab === "ALL" ? null : selectedSubCategory,
    });
    setShowCreateTest(true);
  };

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 relative p-6">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: "25px 25px",
        }}
      />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
              <GraduationCap className="w-4 h-4" />
              Examination System
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Tests & Assessments
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage UPSC & TNPSC examinations
            </p>
          </div>
        </div>

        {/* Exam Type Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(v) => {
            setSelectedTab(v as "ALL" | ExamType);
            setSelectedSubCategory(null);
          }}
        >
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200">
            <TabsTrigger
              value="ALL"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
            >
              All Tests
            </TabsTrigger>
            <TabsTrigger
              value={ExamType.UPSC}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
            >
              UPSC
            </TabsTrigger>
            <TabsTrigger
              value={ExamType.TNPSC}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
            >
              TNPSC
            </TabsTrigger>
          </TabsList>

          {/* All Tests Tab */}
          <TabsContent value="ALL" className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tests..."
                  value={testsPagination.search}
                  onChange={(e) => testsPagination.setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {userRole === "admin" && (
                <Button
                  onClick={openCreateTestDialog}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testsPagination.loading ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Loading tests...
                </div>
              ) : testsPagination.items.length > 0 ? (
                testsPagination.items.map((test: any) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onDelete={() => handleDeleteTest(test.id)}
                    onAttempted={(name, status) => setAttemptedDialog({ open: true, testName: name, status })}
                    getStatusBadge={getStatusBadge}
                    isMains={test.category === TestCategory.MAINS}
                    userRole={userRole}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No tests found. Create your first test!
                </div>
              )}
            </div>
            <PaginationControls
              currentPage={testsPagination.currentPage}
              totalPages={testsPagination.totalPages}
              totalItems={testsPagination.totalItems}
              startIndex={testsPagination.startIndex}
              endIndex={testsPagination.endIndex}
              onPageChange={testsPagination.setCurrentPage}
              itemLabel="tests"
            />
          </TabsContent>

          {/* UPSC / TNPSC Tabs */}
          {[ExamType.UPSC, ExamType.TNPSC].map((examType) => (
          <TabsContent key={examType} value={examType} className="mt-6">
            {/* Category Tabs (Prelims / Mains) */}
            <Tabs
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v as TestCategory);
                setSelectedSubCategory(null);
              }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg shadow-sm">
                  <TabsTrigger
                    value={TestCategory.PRELIMS}
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Prelims
                  </TabsTrigger>
                  <TabsTrigger
                    value={TestCategory.MAINS}
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-rose-500 data-[state=active]:shadow-md transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Mains
                  </TabsTrigger>
                </TabsList>

                {userRole === "admin" && (
                  <div className="flex gap-2">
                    {selectedCategory === TestCategory.PRELIMS && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewSubCategory({
                            ...newSubCategory,
                            exam_type: examType,
                          });
                          setShowCreateSubCategory(true);
                        }}
                      >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Add Sub-Category
                      </Button>
                    )}
                    <Button
                      onClick={openCreateTestDialog}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Test
                    </Button>
                  </div>
                )}
              </div>

              {/* Prelims Content */}
              <TabsContent value={TestCategory.PRELIMS} className="space-y-6">
                {/* Sub-Categories */}
                {filteredSubCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={
                        selectedSubCategory === null ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedSubCategory(null)}
                    >
                      All
                    </Button>
                    {filteredSubCategories.map((sc) => (
                      <Button
                        key={sc.id}
                        variant={
                          selectedSubCategory === sc.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedSubCategory(sc.id)}
                      >
                        {sc.name} ({sc.test_count})
                      </Button>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tests..."
                    value={testsPagination.search}
                    onChange={(e) => testsPagination.setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tests Grid */}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {testsPagination.loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      Loading tests...
                    </div>
                  ) : testsPagination.items.length > 0 ? (
                    testsPagination.items.map((test: any) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        onDelete={() => handleDeleteTest(test.id)}
                        onAttempted={(name, status) => setAttemptedDialog({ open: true, testName: name, status })}
                        getStatusBadge={getStatusBadge}
                        userRole={userRole}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      No tests found. Create your first test!
                    </div>
                  )}
                </div>
                <PaginationControls
                  currentPage={testsPagination.currentPage}
                  totalPages={testsPagination.totalPages}
                  totalItems={testsPagination.totalItems}
                  startIndex={testsPagination.startIndex}
                  endIndex={testsPagination.endIndex}
                  onPageChange={testsPagination.setCurrentPage}
                  itemLabel="tests"
                />
              </TabsContent>

              {/* Mains Content */}
              <TabsContent value={TestCategory.MAINS} className="space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tests..."
                    value={testsPagination.search}
                    onChange={(e) => testsPagination.setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tests Grid */}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {testsPagination.loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      Loading tests...
                    </div>
                  ) : testsPagination.items.length > 0 ? (
                    testsPagination.items.map((test: any) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        onDelete={() => handleDeleteTest(test.id)}
                        onAttempted={(name, status) => setAttemptedDialog({ open: true, testName: name, status })}
                        getStatusBadge={getStatusBadge}
                        isMains
                        userRole={userRole}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      No tests found. Create your first test!
                    </div>
                  )}
                </div>
                <PaginationControls
                  currentPage={testsPagination.currentPage}
                  totalPages={testsPagination.totalPages}
                  totalItems={testsPagination.totalItems}
                  startIndex={testsPagination.startIndex}
                  endIndex={testsPagination.endIndex}
                  onPageChange={testsPagination.setCurrentPage}
                  itemLabel="tests"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create Test Dialog */}
      <Dialog open={showCreateTest} onOpenChange={setShowCreateTest}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Test Name *</Label>
                <Input
                  value={newTest.test_name}
                  onChange={(e) =>
                    setNewTest({ ...newTest, test_name: e.target.value })
                  }
                  placeholder="Enter test name"
                />
              </div>

              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                  placeholder="Test description"
                  rows={2}
                />
              </div>

              {/* Exam Type & Category */}
              <div>
                <Label>Exam Type *</Label>
                <Select
                  value={newTest.exam_type}
                  onValueChange={(v) =>
                    setNewTest({ ...newTest, exam_type: v as ExamType, sub_category_id: null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ExamType.UPSC}>UPSC</SelectItem>
                    <SelectItem value={ExamType.TNPSC}>TNPSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category *</Label>
                <Select
                  value={newTest.category}
                  onValueChange={(v) =>
                    setNewTest({ ...newTest, category: v as TestCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TestCategory.PRELIMS}>
                      Prelims (MCQ)
                    </SelectItem>
                    <SelectItem value={TestCategory.MAINS}>
                      Mains (Descriptive)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sub-Category</Label>
                {dialogSubCategories.length > 0 ? (
                  <Select
                    value={newTest.sub_category_id?.toString() || ""}
                    onValueChange={(v) =>
                      setNewTest({
                        ...newTest,
                        sub_category_id: v ? parseInt(v) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {dialogSubCategories.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id.toString()}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      No sub-categories available.
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-indigo-600"
                      onClick={() => {
                        setNewSubCategory({
                          ...newSubCategory,
                          exam_type: newTest.exam_type,
                        });
                        setShowCreateSubCategory(true);
                      }}
                    >
                      Create one
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newTest.duration_minutes}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      duration_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={newTest.total_marks}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      total_marks: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Passing Marks</Label>
                <Input
                  type="number"
                  value={newTest.passing_marks}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      passing_marks: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {newTest.category === TestCategory.PRELIMS && (
                <div>
                  <Label>Negative Marking (per wrong answer)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={newTest.negative_marking}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        negative_marking: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}

              {/* Activation Method */}
              <div className="col-span-2 border-t pt-4">
                <h4 className="font-medium mb-3">Test Activation</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Activation Method</Label>
                    <Select
                      value={newTest.activation_method}
                      onValueChange={(v) =>
                        setNewTest({
                          ...newTest,
                          activation_method: v as ActivationMethod,
                          start_datetime:
                            v === ActivationMethod.MANUAL
                              ? ""
                              : newTest.start_datetime,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ActivationMethod.MANUAL}>
                          Manual - Available as soon as published
                        </SelectItem>
                        <SelectItem value={ActivationMethod.SCHEDULED}>
                          Scheduled - Set a time period
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {newTest.activation_method === ActivationMethod.MANUAL
                        ? "Students can attend the test as soon as it is published. Optionally set an end date."
                        : "Students can only attend the test within the scheduled time period."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {newTest.activation_method ===
                      ActivationMethod.SCHEDULED && (
                      <div>
                        <Label>Start Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={newTest.start_datetime}
                          onChange={(e) =>
                            setNewTest({
                              ...newTest,
                              start_datetime: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label>End Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={newTest.end_datetime}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            end_datetime: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newTest.activation_method === ActivationMethod.MANUAL
                          ? "Optional. Students won't be able to start after this time."
                          : "Required. Test will close at this time."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <Label>Instructions</Label>
                <Textarea
                  value={newTest.instructions}
                  onChange={(e) =>
                    setNewTest({ ...newTest, instructions: e.target.value })
                  }
                  placeholder="Test instructions for students"
                  rows={3}
                />
              </div>

              {/* Access Control */}
              <div className="col-span-2 border-t pt-4">
                <h4 className="font-medium mb-3">Test Access</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Batches</Label>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        const id = parseInt(v);
                        if (!newTest.batch_ids.includes(id)) {
                          setNewTest({
                            ...newTest,
                            batch_ids: [...newTest.batch_ids, id],
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches
                          .filter((b: any) => !newTest.batch_ids.includes(b.id))
                          .map((b: any) => (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {b.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTest.batch_ids.map((id) => {
                        const batch = batches.find((b: any) => b.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              setNewTest({
                                ...newTest,
                                batch_ids: newTest.batch_ids.filter(
                                  (bid) => bid !== id,
                                ),
                              })
                            }
                          >
                            {batch?.name} x
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Students</Label>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        const id = parseInt(v);
                        if (!newTest.student_ids.includes(id)) {
                          setNewTest({
                            ...newTest,
                            student_ids: [...newTest.student_ids, id],
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students
                          .filter(
                            (s: any) => !newTest.student_ids.includes(s.id),
                          )
                          .map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTest.student_ids.map((id) => {
                        const student = students.find((s: any) => s.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer bg-indigo-50"
                            onClick={() =>
                              setNewTest({
                                ...newTest,
                                student_ids: newTest.student_ids.filter(
                                  (sid) => sid !== id,
                                ),
                              })
                            }
                          >
                            {student?.name} x
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Courses</Label>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        const id = parseInt(v);
                        if (!newTest.course_ids.includes(id)) {
                          setNewTest({
                            ...newTest,
                            course_ids: [...newTest.course_ids, id],
                            // Clear faculties that don't belong to any selected course
                            faculty_ids: newTest.faculty_ids.filter((fid) => {
                              const updatedCourseIds = [...newTest.course_ids, id];
                              return updatedCourseIds.some((cid) => {
                                const c = courses.find((course: any) => course.id === cid);
                                return c?.faculty_ids?.includes(fid);
                              });
                            }),
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Map to course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses
                          .filter(
                            (c: any) => !newTest.course_ids.includes(c.id),
                          )
                          .map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.course_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTest.course_ids.map((id) => {
                        const course = courses.find((c: any) => c.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              const updatedCourseIds = newTest.course_ids.filter((cid) => cid !== id);
                              // Remove faculties that no longer belong to any remaining course
                              const updatedFacultyIds = newTest.faculty_ids.filter((fid) =>
                                updatedCourseIds.some((cid) => {
                                  const c = courses.find((course: any) => course.id === cid);
                                  return c?.faculty_ids?.includes(fid);
                                })
                              );
                              // Clear subject if it no longer belongs to any remaining course
                              const subjectStillValid = newTest.subject_id
                                ? updatedCourseIds.some((cid) => {
                                    const c = courses.find((course: any) => course.id === cid);
                                    return c?.subject_ids?.includes(newTest.subject_id!);
                                  })
                                : true;
                              setNewTest({
                                ...newTest,
                                course_ids: updatedCourseIds,
                                faculty_ids: updatedFacultyIds,
                                subject_id: subjectStillValid ? newTest.subject_id : null,
                              });
                            }}
                          >
                            {course?.course_name} x
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Faculties</Label>
                    {newTest.course_ids.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a course first to see available faculties
                      </p>
                    ) : (
                      <>
                        <Select
                          value=""
                          onValueChange={(v) => {
                            const id = parseInt(v);
                            if (!newTest.faculty_ids.includes(id)) {
                              setNewTest({
                                ...newTest,
                                faculty_ids: [...newTest.faculty_ids, id],
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add faculty" />
                          </SelectTrigger>
                          <SelectContent>
                            {faculties
                              .filter((f: any) => {
                                if (newTest.faculty_ids.includes(f.id)) return false;
                                // Only show faculties that belong to at least one selected course
                                return newTest.course_ids.some((cid) => {
                                  const c = courses.find((course: any) => course.id === cid);
                                  return c?.faculty_ids?.includes(f.id);
                                });
                              })
                              .map((f: any) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                  {f.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newTest.faculty_ids.map((id) => {
                            const faculty = faculties.find((f: any) => f.id === id);
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="cursor-pointer bg-rose-50"
                                onClick={() =>
                                  setNewTest({
                                    ...newTest,
                                    faculty_ids: newTest.faculty_ids.filter(
                                      (fid) => fid !== id,
                                    ),
                                  })
                                }
                              >
                                {faculty?.name} x
                              </Badge>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Subject - filtered by selected courses */}
                  <div className="col-span-2">
                    <Label>Subject</Label>
                    {newTest.course_ids.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a course first to see available subjects
                      </p>
                    ) : (
                      <Select
                        value={newTest.subject_id?.toString() || ""}
                        onValueChange={(v) =>
                          setNewTest({
                            ...newTest,
                            subject_id: v ? parseInt(v) : null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects
                            .filter((s: any) => {
                              // Only show subjects that belong to at least one selected course
                              return newTest.course_ids.some((cid) => {
                                const c = courses.find((course: any) => course.id === cid);
                                return c?.subject_ids?.includes(s.id);
                              });
                            })
                            .map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Validation warnings */}
          {(() => {
            const missing: string[] = [];
            if (!newTest.test_name.trim()) missing.push("Test name");
            if (!newTest.instructions.trim()) missing.push("Instructions");
            if (!newTest.duration_minutes || newTest.duration_minutes <= 0) missing.push("Duration");
            if (!newTest.total_marks || newTest.total_marks <= 0) missing.push("Total marks");
            if (!newTest.passing_marks || newTest.passing_marks <= 0) missing.push("Passing marks");
            if (newTest.course_ids.length === 0) missing.push("At least one course");
            return missing.length > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Required fields missing:</p>
                  <p>{missing.join(", ")}</p>
                </div>
              </div>
            ) : null;
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTest(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTest}
              disabled={
                !newTest.test_name.trim() ||
                !newTest.instructions.trim() ||
                !newTest.duration_minutes || newTest.duration_minutes <= 0 ||
                !newTest.total_marks || newTest.total_marks <= 0 ||
                !newTest.passing_marks || newTest.passing_marks <= 0 ||
                newTest.course_ids.length === 0
              }
              className="bg-gradient-to-r from-indigo-500 to-blue-500"
            >
              Create Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sub-Category Dialog */}
      <Dialog
        open={showCreateSubCategory}
        onOpenChange={setShowCreateSubCategory}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create Sub-Category for {newSubCategory.exam_type}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newSubCategory.name}
                onChange={(e) =>
                  setNewSubCategory({ ...newSubCategory, name: e.target.value })
                }
                placeholder="e.g., General Studies, CSAT"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newSubCategory.description}
                onChange={(e) =>
                  setNewSubCategory({
                    ...newSubCategory,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateSubCategory(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubCategory}
              disabled={!newSubCategory.name}
              className="bg-gradient-to-r from-indigo-500 to-blue-500"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Already Attempted Dialog */}
      <Dialog
        open={attemptedDialog.open}
        onOpenChange={(open) =>
          setAttemptedDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Test Already Attempted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              You have already attempted the test{" "}
              <span className="font-semibold text-slate-900">
                &quot;{attemptedDialog.testName}&quot;
              </span>
              . Re-attempts are not allowed.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border">
              <span className="text-sm text-slate-600">Status:</span>
              <Badge className="bg-emerald-500">
                {attemptedDialog.status === "SUBMITTED"
                  ? "Submitted"
                  : attemptedDialog.status === "EVALUATED"
                    ? "Evaluated"
                    : attemptedDialog.status === "IN_PROGRESS"
                      ? "In Progress"
                      : attemptedDialog.status}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                setAttemptedDialog({ open: false, testName: "", status: "" })
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Test Card Component
function TestCard({
  test,
  onDelete,
  onAttempted,
  getStatusBadge,
  isMains = false,
  userRole = "student",
}: {
  test: TestListItem;
  onDelete: () => void;
  onAttempted: (testName: string, status: string) => void;
  getStatusBadge: (status: TestStatus) => React.ReactNode;
  isMains?: boolean;
  userRole?: string;
}) {
  const isStudent = userRole === "student";
  const isPublished = test.status === TestStatus.PUBLISHED;

  // Check if test is expired or not yet started
  const now = new Date();
  const isExpired = test.end_datetime ? new Date(test.end_datetime) < now : false;
  const isNotStartedYet =
    test.activation_method === "SCHEDULED" && test.start_datetime
      ? new Date(test.start_datetime) > now
      : false;
  const isAvailable = isPublished && !isExpired && !isNotStartedYet;
  const hasAttempted = test.has_attempted === true;
  const attemptStatus = test.attempt_status || "";
  const isSubmittedOrEvaluated = attemptStatus === "SUBMITTED" || attemptStatus === "EVALUATED";

  const statusColor = test.status === TestStatus.PUBLISHED
    ? "from-emerald-500 to-green-500"
    : test.status === TestStatus.ARCHIVED
      ? "from-slate-400 to-slate-500"
      : "from-amber-400 to-blue-400";

  return (
    <Card className="group overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${statusColor}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-slate-900 line-clamp-2 text-[15px] leading-snug pr-3">
            {test.test_name}
          </h3>
          {getStatusBadge(test.status)}
        </div>

        {/* Category indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-md ${
            isMains
              ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
              : "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
          }`}>
            {isMains ? (
              <><FileText className="h-3.5 w-3.5" /> Mains</>
            ) : (
              <><BookOpen className="h-3.5 w-3.5" /> Prelims</>
            )}
          </span>
          {test.exam_type && (
            <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md">
              {test.exam_type}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-0 rounded-lg bg-slate-50 border border-slate-100 divide-x divide-slate-200 mb-4">
          <div className="flex-1 flex flex-col items-center py-2.5">
            <span className="text-xs text-slate-500 mb-0.5">Duration</span>
            <span className="text-sm font-semibold text-slate-800">
              {test.duration_minutes ? `${test.duration_minutes}m` : "--"}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2.5">
            <span className="text-xs text-slate-500 mb-0.5">
              {isMains ? "Type" : "Questions"}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {isMains ? "PDF" : test.question_count}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2.5">
            <span className="text-xs text-slate-500 mb-0.5">Marks</span>
            <span className="text-sm font-semibold text-slate-800">{test.total_marks}</span>
          </div>
        </div>

        {/* Schedule info */}
        {(test.start_datetime || test.end_datetime) && (
          <div className="flex flex-col gap-1 text-xs text-slate-500 mb-4 px-1">
            {test.start_datetime && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>Starts: {new Date(test.start_datetime).toLocaleDateString()}</span>
              </div>
            )}
            {test.end_datetime && (
              <div className="flex items-center gap-1.5">
                <Calendar className={`h-3 w-3 ${isExpired ? "text-red-500" : ""}`} />
                <span className={isExpired ? "text-red-600 font-medium" : ""}>
                  {isExpired ? "Expired" : `Ends: ${new Date(test.end_datetime).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Student score badge */}
        {isStudent && hasAttempted && isSubmittedOrEvaluated && attemptStatus === "EVALUATED" && test.attempt_score !== undefined && test.attempt_score !== null && (
          <div className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 border border-slate-100 mb-4">
            <span className="text-xs text-slate-500">Score</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {test.pass_mark_unit === "percentage"
                  ? `${test.attempt_percentage?.toFixed(1)}%`
                  : `${test.attempt_score}/${test.total_marks}`}
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                (test.pass_mark_unit === "percentage"
                  ? (test.attempt_percentage ?? 0) >= (test.passing_marks ?? 0)
                  : test.attempt_score >= (test.passing_marks ?? 0))
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {(test.pass_mark_unit === "percentage"
                  ? (test.attempt_percentage ?? 0) >= (test.passing_marks ?? 0)
                  : test.attempt_score >= (test.passing_marks ?? 0)) ? "PASS" : "FAIL"}
              </span>
            </div>
          </div>
        )}

        {/* Action */}
        <div>
          {isStudent ? (
            hasAttempted && isSubmittedOrEvaluated ? (
              <div>
                {test.attempt_id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                    asChild
                  >
                    <Link href={`/dashboard/tests/${test.id}/attempts/${test.attempt_id}`}>
                      <Award className="h-4 w-4 mr-2" />
                      View Results
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 text-emerald-700 bg-emerald-50/50"
                    onClick={() => onAttempted(test.test_name, attemptStatus)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {attemptStatus === "SUBMITTED" ? "Submitted" : attemptStatus === "EVALUATED" ? "Evaluated" : attemptStatus}
                  </Button>
                )}
              </div>
            ) : isExpired ? (
              <Button variant="ghost" size="sm" className="w-full text-slate-400 cursor-not-allowed" disabled>
                Test Expired
              </Button>
            ) : isNotStartedYet ? (
              <Button variant="ghost" size="sm" className="w-full text-amber-600 cursor-not-allowed" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Starts {test.start_datetime ? new Date(test.start_datetime).toLocaleDateString() : "Soon"}
              </Button>
            ) : isAvailable ? (
              <Button
                asChild
                size="sm"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white shadow-sm"
              >
                <Link href={`/dashboard/tests/${test.id}/take`}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-slate-400 cursor-not-allowed" disabled>
                Not Available
              </Button>
            )
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                asChild
              >
                <Link href={`/dashboard/tests/${test.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
              {userRole === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
