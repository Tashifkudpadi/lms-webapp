"use client";

import React, { useEffect, useState } from "react";
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
  FileText,
  Eye,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Play,
  CheckCircle2,
  Award,
  Plus,
  Lock,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchMyTests,
  fetchTests,
  fetchSubCategories,
  createTest,
  createSubCategory,
  ExamType,
  TestCategory,
  TestStatus,
  TestListItem,
  ActivationMethod,
} from "@/store/tests";
import { fetchBatches } from "@/store/batches";
import { fetchCourses } from "@/store/courses";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { fetchSubjects } from "@/store/subjects";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface TestsTabProps {
  courseId: string;
}

export default function TestsTab({ courseId }: TestsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { tests, loading, subCategories } = useSelector(
    (state: RootState) => state.testsReducer
  );
  const user = useSelector((state: RootState) => state.authReducer?.user);
  const userRole = user?.role || "student";
  const isStudent = userRole === "student";

  const batches = useSelector(
    (state: RootState) => state.batchesReducer?.batches || []
  );
  const courses = useSelector(
    (state: RootState) => state.coursesReducer?.list || []
  );
  const students = useSelector(
    (state: RootState) => state.studentsReducer?.students || []
  );
  const faculties = useSelector(
    (state: RootState) => state.facultyReducer?.faculty || []
  );
  const subjects = useSelector(
    (state: RootState) => state.subjectsReducer?.subjects || []
  );

  const [selectedExamType, setSelectedExamType] = useState<ExamType>(
    ExamType.UPSC
  );
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>(
    TestCategory.PRELIMS
  );
  const [attemptedDialog, setAttemptedDialog] = useState<{
    open: boolean;
    testName: string;
    status: string;
  }>({ open: false, testName: "", status: "" });

  // Create test dialog
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);

  const courseIdNum = Number(courseId);
  const currentCourse = courses.find((c: any) => c.id === courseIdNum);

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
    course_ids: [courseIdNum],
  });

  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    description: "",
    exam_type: ExamType.UPSC,
  });

  // Fetch tests for this course on mount
  useEffect(() => {
    if (isStudent) {
      dispatch(fetchMyTests({ course_id: courseIdNum }));
    } else {
      dispatch(fetchTests({ course_id: courseIdNum }));
    }
  }, [dispatch, courseIdNum, isStudent]);

  // Fetch data when create test dialog opens
  useEffect(() => {
    if (showCreateTest) {
      dispatch(fetchSubCategories());
      dispatch(fetchBatches());
      dispatch(fetchCourses());
      dispatch(fetchStudents());
      dispatch(fetchFaculties());
      dispatch(fetchSubjects());
    }
  }, [showCreateTest, dispatch]);

  // Filter sub-categories for the dialog (uses newTest.exam_type)
  const dialogSubCategories = (subCategories || []).filter(
    (sc) => sc.exam_type === newTest.exam_type
  );

  const toISOWithTimezone = (dt: string): string | undefined => {
    if (!dt) return undefined;
    const d = new Date(dt);
    return d.toISOString();
  };

  const handleCreateTest = async () => {
    try {
      const payload: any = {
        ...newTest,
        course_ids: [courseIdNum], // always force this course
        sub_category_id: newTest.sub_category_id ?? undefined,
        subject_id: newTest.subject_id ?? undefined,
        start_datetime: toISOWithTimezone(newTest.start_datetime),
        end_datetime: toISOWithTimezone(newTest.end_datetime),
      };
      await dispatch(createTest(payload)).unwrap();
      toast({ title: "Test created successfully", variant: "success" });
      setShowCreateTest(false);
      resetForm();
      // Refresh tests list for this course
      if (isStudent) {
        dispatch(fetchMyTests({ course_id: courseIdNum }));
      } else {
        dispatch(fetchTests({ course_id: courseIdNum }));
      }
    } catch (err: any) {
      toast({ title: "Failed to create test", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      await dispatch(createSubCategory(newSubCategory)).unwrap();
      toast({ title: "Sub-category created", variant: "success" });
      setShowCreateSubCategory(false);
      setNewSubCategory({ name: "", description: "", exam_type: selectedExamType });
    } catch (err: any) {
      toast({ title: "Failed to create sub-category", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewTest({
      test_name: "",
      description: "",
      exam_type: selectedExamType,
      category: selectedCategory,
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
      course_ids: [courseIdNum],
    });
  };

  const openCreateTestDialog = () => {
    setNewTest({
      ...newTest,
      test_name: "",
      description: "",
      exam_type: selectedExamType,
      category: selectedCategory,
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
      course_ids: [courseIdNum],
    });
    setShowCreateTest(true);
  };

  // Filter by exam type and category
  const filteredTests = tests.filter(
    (test) =>
      test.exam_type === selectedExamType && test.category === selectedCategory
  );

  // Count tests by category
  const upscPrelimsCount = tests.filter(
    (t) => t.exam_type === ExamType.UPSC && t.category === TestCategory.PRELIMS
  ).length;
  const upscMainsCount = tests.filter(
    (t) => t.exam_type === ExamType.UPSC && t.category === TestCategory.MAINS
  ).length;
  const tnpscPrelimsCount = tests.filter(
    (t) => t.exam_type === ExamType.TNPSC && t.category === TestCategory.PRELIMS
  ).length;
  const tnpscMainsCount = tests.filter(
    (t) => t.exam_type === ExamType.TNPSC && t.category === TestCategory.MAINS
  ).length;

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

  const getAttemptStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Submitted";
      case "EVALUATED":
        return "Evaluated";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return status;
    }
  };

  // Faculties filtered by this course
  const courseFaculties = faculties.filter((f: any) => {
    return currentCourse?.faculty_ids?.includes(f.id);
  });

  // Subjects filtered by this course
  const courseSubjects = subjects.filter((s: any) => {
    return currentCourse?.subject_ids?.includes(s.id);
  });

  const CreateTestButton = () =>
    userRole === "admin" ? (
      <div className="flex justify-end">
        <Button
          onClick={openCreateTestDialog}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <CreateTestButton />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading tests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="space-y-6">
        <CreateTestButton />
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Tests Assigned</h3>
          <p className="text-muted-foreground">
            No tests have been mapped to this course yet.
          </p>
        </div>
        {renderCreateTestDialog()}
      </div>
    );
  }

  function renderCreateTestDialog() {
    return (
      <>
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
                      <SelectItem value={TestCategory.PRELIMS}>Prelims (MCQ)</SelectItem>
                      <SelectItem value={TestCategory.MAINS}>Mains (Descriptive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sub-Category</Label>
                  {dialogSubCategories.length > 0 ? (
                    <Select
                      value={newTest.sub_category_id?.toString() || ""}
                      onValueChange={(v) =>
                        setNewTest({ ...newTest, sub_category_id: v ? parseInt(v) : null })
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
                        className="h-auto p-0 text-blue-600"
                        onClick={() => {
                          setNewSubCategory({ ...newSubCategory, exam_type: newTest.exam_type });
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
                      setNewTest({ ...newTest, duration_minutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={newTest.total_marks}
                    onChange={(e) =>
                      setNewTest({ ...newTest, total_marks: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label>Passing Marks</Label>
                  <Input
                    type="number"
                    value={newTest.passing_marks}
                    onChange={(e) =>
                      setNewTest({ ...newTest, passing_marks: parseFloat(e.target.value) || 0 })
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
                        setNewTest({ ...newTest, negative_marking: parseFloat(e.target.value) || 0 })
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
                            start_datetime: v === ActivationMethod.MANUAL ? "" : newTest.start_datetime,
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
                      {newTest.activation_method === ActivationMethod.SCHEDULED && (
                        <div>
                          <Label>Start Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={newTest.start_datetime}
                            onChange={(e) =>
                              setNewTest({ ...newTest, start_datetime: e.target.value })
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
                            setNewTest({ ...newTest, end_datetime: e.target.value })
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
                            setNewTest({ ...newTest, batch_ids: [...newTest.batch_ids, id] });
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
                                setNewTest({ ...newTest, batch_ids: newTest.batch_ids.filter((bid) => bid !== id) })
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
                            setNewTest({ ...newTest, student_ids: [...newTest.student_ids, id] });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students
                            .filter((s: any) => !newTest.student_ids.includes(s.id))
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
                              className="cursor-pointer bg-blue-50"
                              onClick={() =>
                                setNewTest({ ...newTest, student_ids: newTest.student_ids.filter((sid) => sid !== id) })
                              }
                            >
                              {student?.name} x
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Course - locked to current course */}
                    <div>
                      <Label className="flex items-center gap-1.5">
                        Course
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      </Label>
                      <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-slate-100 border rounded-md">
                        <span className="text-sm font-medium">
                          {currentCourse?.course_name || `Course #${courseId}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This test will be mapped to this course.
                      </p>
                    </div>

                    <div>
                      <Label>Faculties</Label>
                      {courseFaculties.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          No faculties assigned to this course
                        </p>
                      ) : (
                        <>
                          <Select
                            value=""
                            onValueChange={(v) => {
                              const id = parseInt(v);
                              if (!newTest.faculty_ids.includes(id)) {
                                setNewTest({ ...newTest, faculty_ids: [...newTest.faculty_ids, id] });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              {courseFaculties
                                .filter((f: any) => !newTest.faculty_ids.includes(f.id))
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
                                  className="cursor-pointer bg-purple-50"
                                  onClick={() =>
                                    setNewTest({ ...newTest, faculty_ids: newTest.faculty_ids.filter((fid) => fid !== id) })
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

                    {/* Subject - filtered by this course */}
                    <div className="col-span-2">
                      <Label>Subject</Label>
                      {courseSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          No subjects assigned to this course
                        </p>
                      ) : (
                        <Select
                          value={newTest.subject_id?.toString() || ""}
                          onValueChange={(v) =>
                            setNewTest({ ...newTest, subject_id: v ? parseInt(v) : null })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {courseSubjects.map((s: any) => (
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
                  !newTest.passing_marks || newTest.passing_marks <= 0
                }
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Sub-Category Dialog */}
        <Dialog open={showCreateSubCategory} onOpenChange={setShowCreateSubCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sub-Category for {newTest.exam_type}</DialogTitle>
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
                    setNewSubCategory({ ...newSubCategory, description: e.target.value })
                  }
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateSubCategory(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubCategory}
                disabled={!newSubCategory.name}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">
                {upscPrelimsCount + upscMainsCount}
              </p>
              <p className="text-sm text-blue-600">UPSC Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700">
                {tnpscPrelimsCount + tnpscMainsCount}
              </p>
              <p className="text-sm text-purple-600">TNPSC Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {upscPrelimsCount + tnpscPrelimsCount}
              </p>
              <p className="text-sm text-green-600">Prelims</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-700">
                {upscMainsCount + tnpscMainsCount}
              </p>
              <p className="text-sm text-orange-600">Mains</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Create button */}
      <CreateTestButton />

      {/* Exam Type Tabs */}
      <Tabs
        value={selectedExamType}
        onValueChange={(v) => setSelectedExamType(v as ExamType)}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value={ExamType.UPSC}>
            UPSC ({upscPrelimsCount + upscMainsCount})
          </TabsTrigger>
          <TabsTrigger value={ExamType.TNPSC}>
            TNPSC ({tnpscPrelimsCount + tnpscMainsCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedExamType} className="mt-4">
          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as TestCategory)}
          >
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value={TestCategory.PRELIMS}>
                <BookOpen className="w-4 h-4 mr-2" />
                Prelims (
                {selectedExamType === ExamType.UPSC
                  ? upscPrelimsCount
                  : tnpscPrelimsCount}
                )
              </TabsTrigger>
              <TabsTrigger value={TestCategory.MAINS}>
                <FileText className="w-4 h-4 mr-2" />
                Mains (
                {selectedExamType === ExamType.UPSC
                  ? upscMainsCount
                  : tnpscMainsCount}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              {filteredTests.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTests.map((test) => {
                    const now = new Date();
                    const isPublished = test.status === TestStatus.PUBLISHED;
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
                        : "from-amber-400 to-orange-400";

                    return (
                      <Card
                        key={test.id}
                        className="group overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                      >
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
                              selectedCategory === TestCategory.MAINS
                                ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                                : "bg-blue-600 text-white shadow-sm shadow-blue-200"
                            }`}>
                              {selectedCategory === TestCategory.MAINS ? (
                                <><FileText className="h-3.5 w-3.5" /> Mains</>
                              ) : (
                                <><BookOpen className="h-3.5 w-3.5" /> Prelims</>
                              )}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md">
                              {selectedExamType}
                            </span>
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
                                {selectedCategory === TestCategory.MAINS ? "Type" : "Questions"}
                              </span>
                              <span className="text-sm font-semibold text-slate-800">
                                {selectedCategory === TestCategory.MAINS ? "PDF" : test.question_count}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center py-2.5">
                              <span className="text-xs text-slate-500 mb-0.5">Marks</span>
                              <span className="text-sm font-semibold text-slate-800">{test.total_marks}</span>
                            </div>
                          </div>

                          {/* Student status badge */}
                          {isStudent && (isExpired || (hasAttempted && isSubmittedOrEvaluated)) && (
                            <div className="mb-4">
                              {isExpired && !hasAttempted && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-md px-3 py-1.5 border border-red-100">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="font-medium">Expired</span>
                                </div>
                              )}
                              {hasAttempted && isSubmittedOrEvaluated && attemptStatus === "EVALUATED" && test.attempt_score !== undefined && test.attempt_score !== null && (
                                <div className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 border border-slate-100">
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
                                      <Link href={`/dashboard/tests/${test.id}/attempts/${test.attempt_id}?courseId=${courseId}`}>
                                        <Award className="h-4 w-4 mr-2" />
                                        View Results
                                      </Link>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-emerald-200 text-emerald-700 bg-emerald-50/50"
                                      onClick={() =>
                                        setAttemptedDialog({
                                          open: true,
                                          testName: test.test_name,
                                          status: attemptStatus,
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      {getAttemptStatusLabel(attemptStatus)}
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
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                                >
                                  <Link href={`/dashboard/tests/${test.id}/take?courseId=${courseId}`}>
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
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                asChild
                              >
                                <Link href={`/dashboard/tests/${test.id}?courseId=${courseId}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No {selectedCategory.toLowerCase()} tests found for {selectedExamType}.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

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
                {getAttemptStatusLabel(attemptedDialog.status)}
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

      {/* Create Test & Sub-Category Dialogs */}
      {renderCreateTestDialog()}
    </div>
  );
}
