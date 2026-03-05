"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Clock,
  Calendar,
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BookOpen,
  Save,
  Play,
  Archive,
  Settings,
  ClipboardList,
  Timer,
  Award,
  BarChart3,
  Shuffle,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchTestById,
  fetchQuestions,
  fetchTestAttempts,
  fetchStudentsWithAttemptStatus,
  fetchSubCategories,
  fetchTestSubjectsTopics,
  addQuestion,
  deleteQuestion,
  importQuestions,
  updateTest,
  ExamType,
  TestCategory,
  TestStatus,
  ActivationMethod,
  TestQuestion,
  TestAttempt,
  AttemptStatus,
  StudentWithAttemptStatus,
  TestSubjectWithTopics,
} from "@/store/tests";
import { fetchBatches } from "@/store/batches";
import { fetchCourses } from "@/store/courses";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { uploadToMinio } from "@/utils/uploadToMinio";

export default function TestDetailPage() {
  const confirm = useConfirm();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const dispatch = useDispatch<AppDispatch>();
  const testId = Number(params.id);

  const { user } = useSelector((state: RootState) => state.authReducer);
  const userRole = user?.role || "student";
  const isStudent = userRole === "student";

  const {
    selected: test,
    questions,
    attempts,
    studentsWithStatus,
    subCategories,
    testSubjectsTopics,
    loading,
  } = useSelector((state: RootState) => state.testsReducer);
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

  const [activeTab, setActiveTab] = useState("settings");
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const shuffleToggledRef = useRef(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showUploadPdf, setShowUploadPdf] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Question form state
  const [newQuestion, setNewQuestion] = useState({
    question_number: 1,
    question_text: "",
    subject_id: null as number | null,
    topic_id: null as number | null,
    correct_option: 1,
    marks: 1,
    solution: "",
    options: [
      { option_number: 1, option_text: "" },
      { option_number: 2, option_text: "" },
      { option_number: 3, option_text: "" },
      { option_number: 4, option_text: "" },
    ],
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    test_name: "",
    description: "",
    exam_type: ExamType.UPSC,
    category: TestCategory.PRELIMS,
    sub_category_id: null as number | null,
    activation_method: ActivationMethod.MANUAL,
    duration_minutes: 0,
    total_marks: 0,
    passing_marks: 0,
    negative_marking: 0,
    start_datetime: "",
    end_datetime: "",
    instructions: "",
    status: TestStatus.DRAFT,
    course_ids: [] as number[],
    batch_ids: [] as number[],
    student_ids: [] as number[],
    faculty_ids: [] as number[],
  });

  // Grading settings state
  const [gradingSettings, setGradingSettings] = useState({
    pass_mark_value: 0,
    pass_mark_unit: "percentage" as "percentage" | "grade" | "point",
  });

  const [importFile, setImportFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Fetch test data and related data
  useEffect(() => {
    if (testId) {
      dispatch(fetchTestById(testId));
      dispatch(fetchQuestions(testId));
      dispatch(fetchTestSubjectsTopics(testId));
      // Admin/faculty-only data
      if (!isStudent) {
        dispatch(fetchTestAttempts(testId));
        dispatch(fetchStudentsWithAttemptStatus(testId));
        dispatch(fetchBatches());
        dispatch(fetchCourses());
        dispatch(fetchStudents());
        dispatch(fetchFaculties());
      }
      dispatch(fetchSubCategories());
    }
  }, [dispatch, testId, isStudent]);

  // Initialize edit form when test loads
  useEffect(() => {
    if (test) {
      // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (dt?: string) => {
        if (!dt) return "";
        const d = new Date(dt);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setEditForm({
        test_name: test.test_name,
        description: test.description || "",
        exam_type: test.exam_type as ExamType,
        category: test.category as TestCategory,
        sub_category_id: test.sub_category_id || null,
        activation_method:
          (test.activation_method as ActivationMethod) ||
          ActivationMethod.MANUAL,
        duration_minutes: test.duration_minutes || 0,
        total_marks: test.total_marks,
        passing_marks: test.passing_marks || 0,
        negative_marking: test.negative_marking,
        start_datetime: formatDateTimeLocal(test.start_datetime),
        end_datetime: formatDateTimeLocal(test.end_datetime),
        instructions: test.instructions || "",
        status: test.status,
        course_ids: test.course_ids || [],
        batch_ids: test.batch_ids || [],
        student_ids: test.student_ids || [],
        faculty_ids: test.faculty_ids || [],
      });
      // Initialize grading settings
      setGradingSettings({
        pass_mark_value: test.passing_marks || 0,
        pass_mark_unit: (test.pass_mark_unit as "percentage" | "grade" | "point") || "percentage",
      });
      // Sync shuffle state (skip if user just toggled it)
      if (!shuffleToggledRef.current) {
        setShuffleEnabled(test.shuffle_questions || false);
      }
      shuffleToggledRef.current = false;
      // Set next question number
      setNewQuestion((prev) => ({
        ...prev,
        question_number: (test.question_count || 0) + 1,
      }));
    }
  }, [test]);

  const handleAddQuestion = async () => {
    try {
      await dispatch(
        addQuestion({
          testId,
          data: newQuestion,
        }),
      ).unwrap();
      setShowAddQuestion(false);
      setNewQuestion({
        question_number: (test?.question_count || 0) + 2,
        question_text: "",
        subject_id: null,
        topic_id: null,
        correct_option: 1,
        marks: 1,
        solution: "",
        options: [
          { option_number: 1, option_text: "" },
          { option_number: 2, option_text: "" },
          { option_number: 3, option_text: "" },
          { option_number: 4, option_text: "" },
        ],
      });
      dispatch(fetchQuestions(testId));
      dispatch(fetchTestById(testId));
      toast({ title: "Question added successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to add question", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    const ok = await confirm({
      title: "Delete Question",
      description: "Are you sure you want to delete this question?",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (ok) {
      try {
        await dispatch(deleteQuestion({ testId, questionId })).unwrap();
        dispatch(fetchTestById(testId));
        toast({ title: "Question deleted", variant: "success" });
      } catch (err: any) {
        toast({ title: "Failed to delete question", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
      }
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile) return;
    try {
      await dispatch(importQuestions({ testId, file: importFile })).unwrap();
      setShowImportDialog(false);
      setImportFile(null);
      dispatch(fetchQuestions(testId));
      dispatch(fetchTestById(testId));
      toast({ title: "Questions imported successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to import questions", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return;
    setUploading(true);
    try {
      const { objectName, fileUrl } = await uploadToMinio(pdfFile);
      await dispatch(
        updateTest({
          id: testId,
          data: {
            question_file_url: fileUrl,
            question_file_name: pdfFile.name,
          },
        }),
      ).unwrap();
      setShowUploadPdf(false);
      setPdfFile(null);
      dispatch(fetchTestById(testId));
      toast({ title: "PDF uploaded successfully", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to upload PDF", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Convert datetime-local value to ISO string with timezone offset
  const toISOWithTimezone = (dt: string): string | undefined => {
    if (!dt) return undefined;
    // datetime-local gives "YYYY-MM-DDTHH:mm" in local time
    // Create a Date from it (interpreted as local time) and convert to ISO
    const d = new Date(dt);
    return d.toISOString();
  };

  const handleSaveEdit = async () => {
    try {
      const payload: any = {
        ...editForm,
        start_datetime: toISOWithTimezone(editForm.start_datetime),
        end_datetime: toISOWithTimezone(editForm.end_datetime),
      };
      await dispatch(
        updateTest({
          id: testId,
          data: payload,
        }),
      ).unwrap();
      setEditMode(false);
      toast({ title: "Test settings saved", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to save test settings", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    if (!test) return;
    // Frontend validation before publish
    const errors: string[] = [];
    if (
      test.category === TestCategory.PRELIMS &&
      (!questions || questions.length === 0)
    ) {
      errors.push("Add at least one question");
    }
    if (!test.instructions) {
      errors.push("Add test instructions");
    }
    if (!test.duration_minutes || test.duration_minutes <= 0) {
      errors.push("Set test duration");
    }
    if (!test.total_marks || test.total_marks <= 0) {
      errors.push("Set total marks");
    }
    if (!test.passing_marks || test.passing_marks <= 0) {
      errors.push("Set passing marks");
    }
    if (!test.course_ids || test.course_ids.length === 0) {
      errors.push("Assign at least one course");
    }
    if (errors.length > 0) {
      toast({
        title: "Cannot publish test",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    const ok = await confirm({
      title: "Publish Test",
      description:
        "Are you sure you want to publish this test? Students will be able to see and take it.",
      confirmLabel: "Publish",
    });
    if (ok) {
      try {
        await dispatch(
          updateTest({
            id: testId,
            data: { status: TestStatus.PUBLISHED },
          }),
        ).unwrap();
        toast({ title: "Test published successfully", variant: "success" });
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to publish test";
        toast({
          title: "Publish failed",
          description: msg,
          variant: "destructive",
        });
      }
    }
  };

  const handleArchive = async () => {
    const ok = await confirm({
      title: "Archive Test",
      description: "Are you sure you want to archive this test?",
      confirmLabel: "Archive",
      variant: "destructive",
    });
    if (ok) {
      try {
        await dispatch(
          updateTest({
            id: testId,
            data: { status: TestStatus.ARCHIVED },
          }),
        ).unwrap();
        toast({ title: "Test archived", variant: "success" });
      } catch (err: any) {
        toast({ title: "Failed to archive test", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case TestStatus.DRAFT:
        return <Badge variant="secondary">Draft</Badge>;
      case TestStatus.PUBLISHED:
        return <Badge className="bg-green-500">Published</Badge>;
      case TestStatus.ARCHIVED:
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAttemptStatusBadge = (status: AttemptStatus) => {
    switch (status) {
      case AttemptStatus.NOT_STARTED:
        return <Badge variant="outline">Not Started</Badge>;
      case AttemptStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case AttemptStatus.SUBMITTED:
        return <Badge className="bg-yellow-500">Submitted</Badge>;
      case AttemptStatus.EVALUATED:
        return <Badge className="bg-green-500">Evaluated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  const isPrelims = test.category === TestCategory.PRELIMS;
  const isMains = test.category === TestCategory.MAINS;

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(courseId ? `/dashboard/courses/${courseId}` : "/dashboard/tests")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {courseId ? "Back to Course" : "Back to Tests"}
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {test.test_name}
            </h1>
            {getStatusBadge(test.status)}
          </div>
          <p className="text-muted-foreground">
            {test.exam_type} • {test.category}
            {test.sub_category_name && ` • ${test.sub_category_name}`}
          </p>
        </div>

        <div className="flex gap-2">
          {test.status === TestStatus.DRAFT && (
            <Button
              onClick={handlePublish}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
          {test.status === TestStatus.PUBLISHED && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Publish Readiness Checklist */}
      {test.status === TestStatus.DRAFT &&
        !isStudent &&
        (() => {
          const checks = [
            {
              label: "Questions added",
              ok: isPrelims
                ? questions && questions.length > 0
                : !!test.question_file_url,
              tab: "questions",
            },
            {
              label: "Instructions",
              ok: !!test.instructions,
              tab: "instructions",
            },
            {
              label: "Duration & timing",
              ok: !!test.duration_minutes && test.duration_minutes > 0,
              tab: "time",
            },
            {
              label: "Total marks",
              ok: !!test.total_marks && test.total_marks > 0,
              tab: "time",
            },
            {
              label: "Passing marks",
              ok: !!test.passing_marks && test.passing_marks > 0,
              tab: "grading",
            },
            {
              label: "Course assigned",
              ok: !!test.course_ids && test.course_ids.length > 0,
              tab: "settings",
            },
          ];
          const allDone = checks.every((c) => c.ok);
          return (
            <Card
              className={`border ${allDone ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3 mb-2">
                  {allDone ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${allDone ? "text-green-800" : "text-amber-800"}`}
                  >
                    {allDone
                      ? "Ready to publish!"
                      : "Complete these items before publishing:"}
                  </span>
                </div>
                <div className="flex flex-wrap  gap-2 ml-8">
                  {checks.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setActiveTab(c.tab)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        c.ok
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 cursor-pointer"
                      }`}
                    >
                      {c.ok ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {c.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="instructions"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Test Instruction
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Question Manager
          </TabsTrigger>
          <TabsTrigger
            value="time"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Timer className="w-4 h-4 mr-2" />
            Time Settings
          </TabsTrigger>
          <TabsTrigger
            value="grading"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Award className="w-4 h-4 mr-2" />
            Grading & Summary
          </TabsTrigger>
          <TabsTrigger
            value="result"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Result
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Settings</CardTitle>
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Test Name *</Label>
                      <Input
                        value={editForm.test_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            test_name: e.target.value,
                          })
                        }
                        placeholder="Enter test name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Test description"
                      />
                    </div>
                  </div>

                  {/* Category Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Category Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Exam Type</Label>
                        <Select
                          value={editForm.exam_type}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              exam_type: v as ExamType,
                              sub_category_id: null,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ExamType.UPSC}>UPSC</SelectItem>
                            <SelectItem value={ExamType.TNPSC}>
                              TNPSC
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={editForm.category}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              category: v as TestCategory,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TestCategory.PRELIMS}>
                              Prelims
                            </SelectItem>
                            <SelectItem value={TestCategory.MAINS}>
                              Mains
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editForm.category === TestCategory.PRELIMS && (
                        <div>
                          <Label>Sub-Category</Label>
                          <Select
                            value={editForm.sub_category_id?.toString() || ""}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                sub_category_id: v ? parseInt(v) : null,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub-category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(subCategories || [])
                                .filter(
                                  (sc: any) =>
                                    sc.exam_type === editForm.exam_type,
                                )
                                .map((sc: any) => (
                                  <SelectItem
                                    key={sc.id}
                                    value={sc.id.toString()}
                                  >
                                    {sc.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Mapping */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Course Mapping</h4>
                    <div>
                      <Label>Courses</Label>
                      <Select
                        value=""
                        onValueChange={(v) => {
                          const id = parseInt(v);
                          if (!editForm.course_ids.includes(id)) {
                            const updatedCourseIds = [
                              ...editForm.course_ids,
                              id,
                            ];
                            setEditForm({
                              ...editForm,
                              course_ids: updatedCourseIds,
                              faculty_ids: editForm.faculty_ids.filter((fid) =>
                                updatedCourseIds.some((cid) => {
                                  const c = courses.find(
                                    (course: any) => course.id === cid,
                                  );
                                  return c?.faculty_ids?.includes(fid);
                                }),
                              ),
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses
                            .filter(
                              (c: any) => !editForm.course_ids.includes(c.id),
                            )
                            .map((c: any) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.course_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editForm.course_ids.map((id) => {
                          const course = courses.find((c: any) => c.id === id);
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100"
                              onClick={() => {
                                const updatedCourseIds =
                                  editForm.course_ids.filter(
                                    (cid) => cid !== id,
                                  );
                                setEditForm({
                                  ...editForm,
                                  course_ids: updatedCourseIds,
                                  faculty_ids: editForm.faculty_ids.filter(
                                    (fid) =>
                                      updatedCourseIds.some((cid) => {
                                        const c = courses.find(
                                          (course: any) => course.id === cid,
                                        );
                                        return c?.faculty_ids?.includes(fid);
                                      }),
                                  ),
                                });
                              }}
                            >
                              {course?.course_name} ×
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Test Access */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Test Access</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Batches</Label>
                        <Select
                          value=""
                          onValueChange={(v) => {
                            const id = parseInt(v);
                            if (!editForm.batch_ids.includes(id)) {
                              setEditForm({
                                ...editForm,
                                batch_ids: [...editForm.batch_ids, id],
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches
                              .filter(
                                (b: any) => !editForm.batch_ids.includes(b.id),
                              )
                              .map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>
                                  {b.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editForm.batch_ids.map((id) => {
                            const batch = batches.find((b: any) => b.id === id);
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-red-100"
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    batch_ids: editForm.batch_ids.filter(
                                      (bid) => bid !== id,
                                    ),
                                  })
                                }
                              >
                                {batch?.name} ×
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
                            if (!editForm.student_ids.includes(id)) {
                              setEditForm({
                                ...editForm,
                                student_ids: [...editForm.student_ids, id],
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
                                (s: any) =>
                                  !editForm.student_ids.includes(s.id),
                              )
                              .map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editForm.student_ids.map((id) => {
                            const student = students.find(
                              (s: any) => s.id === id,
                            );
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-red-100"
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    student_ids: editForm.student_ids.filter(
                                      (sid) => sid !== id,
                                    ),
                                  })
                                }
                              >
                                {student?.name} ×
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label>Faculties</Label>
                        {editForm.course_ids.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            Select a course first to see available faculties
                          </p>
                        ) : (
                          <>
                            <Select
                              value=""
                              onValueChange={(v) => {
                                const id = parseInt(v);
                                if (!editForm.faculty_ids.includes(id)) {
                                  setEditForm({
                                    ...editForm,
                                    faculty_ids: [...editForm.faculty_ids, id],
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
                                    if (editForm.faculty_ids.includes(f.id))
                                      return false;
                                    return editForm.course_ids.some((cid) => {
                                      const c = courses.find(
                                        (course: any) => course.id === cid,
                                      );
                                      return c?.faculty_ids?.includes(f.id);
                                    });
                                  })
                                  .map((f: any) => (
                                    <SelectItem
                                      key={f.id}
                                      value={f.id.toString()}
                                    >
                                      {f.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editForm.faculty_ids.map((id) => {
                                const faculty = faculties.find(
                                  (f: any) => f.id === id,
                                );
                                return (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100"
                                    onClick={() =>
                                      setEditForm({
                                        ...editForm,
                                        faculty_ids:
                                          editForm.faculty_ids.filter(
                                            (fid) => fid !== id,
                                          ),
                                      })
                                    }
                                  >
                                    {faculty?.name} ×
                                  </Badge>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="col-span-2 space-y-1">
                      <p className="text-sm text-muted-foreground">Test Name</p>
                      <p className="text-lg font-medium">{test.test_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div>{getStatusBadge(test.status)}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Total Marks
                      </p>
                      <p className="text-lg font-medium">{test.total_marks}</p>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      Category Settings
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Exam Type
                        </p>
                        <p className="text-lg font-medium">{test.exam_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Category
                        </p>
                        <p className="text-lg font-medium">{test.category}</p>
                      </div>
                      {test.sub_category_name && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Sub-Category
                          </p>
                          <p className="text-lg font-medium">
                            {test.sub_category_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Mapping */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      Course Mapping
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {test.course_ids && test.course_ids.length > 0 ? (
                        test.course_ids.map((id: number) => {
                          const course = courses.find((c: any) => c.id === id);
                          return course ? (
                            <Badge key={id} variant="outline">
                              {course.course_name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-muted-foreground">
                          No courses mapped
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Test Access */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      Test Access
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Batches
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {test.batch_ids && test.batch_ids.length > 0 ? (
                            test.batch_ids.map((id: number) => {
                              const batch = batches.find(
                                (b: any) => b.id === id,
                              );
                              return batch ? (
                                <Badge key={id} variant="outline">
                                  {batch.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No batches assigned
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Students
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {test.student_ids && test.student_ids.length > 0 ? (
                            test.student_ids.map((id: number) => {
                              const student = students.find(
                                (s: any) => s.id === id,
                              );
                              return student ? (
                                <Badge
                                  key={id}
                                  variant="outline"
                                  className="bg-blue-50"
                                >
                                  {student.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No students assigned
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Faculties
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {test.faculty_ids && test.faculty_ids.length > 0 ? (
                            test.faculty_ids.map((id: number) => {
                              const faculty = faculties.find(
                                (f: any) => f.id === id,
                              );
                              return faculty ? (
                                <Badge
                                  key={id}
                                  variant="outline"
                                  className="bg-purple-50"
                                >
                                  {faculty.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No faculties assigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {test.description && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2 text-muted-foreground">
                        Description
                      </h4>
                      <p>{test.description}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Instruction Tab */}
        <TabsContent value="instructions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Instructions</CardTitle>
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div>
                  <Label>Instructions for Students</Label>
                  <Textarea
                    value={editForm.instructions}
                    onChange={(e) =>
                      setEditForm({ ...editForm, instructions: e.target.value })
                    }
                    rows={10}
                    placeholder="Enter detailed instructions for students taking this test..."
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  {test.instructions ? (
                    <p className="whitespace-pre-wrap">{test.instructions}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      No instructions added yet.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Question Manager Tab */}
        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Question Manager</CardTitle>
                <CardDescription>
                  {isPrelims
                    ? `Manage MCQ questions for this test (${test.question_count} questions)`
                    : "Upload question paper PDF for this test"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {isPrelims && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="shuffle-questions"
                      checked={shuffleEnabled}
                      onCheckedChange={async (checked) => {
                        shuffleToggledRef.current = true;
                        setShuffleEnabled(checked);
                        try {
                          await dispatch(
                            updateTest({
                              id: testId,
                              data: { shuffle_questions: checked },
                            }),
                          ).unwrap();
                          toast({ title: checked ? "Shuffle enabled" : "Shuffle disabled", variant: "success" });
                        } catch (err: any) {
                          toast({ title: "Failed to update shuffle", variant: "destructive" });
                        }
                      }}
                    />
                    <Label
                      htmlFor="shuffle-questions"
                      className="flex items-center gap-1 cursor-pointer text-sm"
                    >
                      <Shuffle className="w-4 h-4" />
                      Shuffle Questions
                    </Label>
                  </div>
                )}
                {isPrelims ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <Button onClick={() => setShowAddQuestion(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowUploadPdf(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isPrelims ? (
                questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx}
                        onDelete={() => handleDeleteQuestion(q.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No questions added yet.</p>
                    <p className="text-sm">
                      Add questions manually or import from Excel/JSON.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  {test.question_file_url ? (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 mx-auto text-blue-600" />
                      <p className="font-medium">{test.question_file_name}</p>
                      <Button variant="outline" asChild>
                        <a
                          href={test.question_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Question Paper
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto opacity-50" />
                      <p>No question paper uploaded yet.</p>
                      <p className="text-sm">
                        Upload a PDF file containing the questions.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Settings Tab */}
        <TabsContent value="time" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Time Settings</CardTitle>
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-6">
                  {/* Test Activation */}
                  <div>
                    <h4 className="font-medium mb-4">Test Activation</h4>
                    <div className="space-y-4">
                      <div>
                        <Label>Activation Method</Label>
                        <Select
                          value={editForm.activation_method}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              activation_method: v as ActivationMethod,
                              start_datetime:
                                v === ActivationMethod.MANUAL
                                  ? ""
                                  : editForm.start_datetime,
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
                          {editForm.activation_method ===
                          ActivationMethod.MANUAL
                            ? "Students can attend the test as soon as it is published. Optionally set an end date."
                            : "Students can only attend the test within the scheduled time period."}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {editForm.activation_method ===
                          ActivationMethod.SCHEDULED && (
                          <div>
                            <Label>Start Date & Time</Label>
                            <Input
                              type="datetime-local"
                              value={editForm.start_datetime}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
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
                            value={editForm.end_datetime}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                end_datetime: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {editForm.activation_method ===
                            ActivationMethod.MANUAL
                              ? "Optional. Students won't be able to start after this time."
                              : "Required. Test will close at this time."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Marks */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Duration & Marks</h4>
                    <div className="grid grid-cols-2 gap-4 max-w-xl">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={editForm.duration_minutes}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              duration_minutes: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter duration in minutes"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Set to 0 for no time limit
                        </p>
                      </div>
                      <div>
                        <Label>Total Marks</Label>
                        <Input
                          type="number"
                          value={editForm.total_marks}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              total_marks: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      {editForm.category === TestCategory.PRELIMS && (
                        <div>
                          <Label>Negative Marking (per wrong answer)</Label>
                          <Input
                            type="number"
                            step="0.25"
                            value={editForm.negative_marking}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                negative_marking:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      )}
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              status: v as TestStatus,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TestStatus.DRAFT}>
                              Draft
                            </SelectItem>
                            <SelectItem value={TestStatus.PUBLISHED}>
                              Published
                            </SelectItem>
                            <SelectItem value={TestStatus.ARCHIVED}>
                              Archived
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Test Activation */}
                  <div>
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      Test Activation
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Activation Method
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            test.activation_method === "SCHEDULED"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }
                        >
                          {test.activation_method === "SCHEDULED"
                            ? "Scheduled"
                            : "Manual"}
                        </Badge>
                      </div>
                      {test.activation_method === "SCHEDULED" &&
                        test.start_datetime && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Start Date & Time
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(test.start_datetime).toLocaleString()}
                            </p>
                          </div>
                        )}
                      {test.end_datetime && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            End Date & Time
                          </p>
                          <p
                            className={`text-sm font-medium flex items-center gap-2 ${
                              new Date(test.end_datetime) < new Date()
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            {new Date(test.end_datetime).toLocaleString()}
                            {new Date(test.end_datetime) < new Date() &&
                              " (Expired)"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration & Stats */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 text-muted-foreground">
                      Duration & Marks
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Test Duration
                        </p>
                        <p className="text-lg font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {test.duration_minutes
                            ? `${test.duration_minutes} minutes`
                            : "No time limit"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Questions
                        </p>
                        <p className="text-lg font-medium">
                          {test.question_count}
                        </p>
                      </div>
                      {test.duration_minutes && test.question_count > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Time per Question
                          </p>
                          <p className="text-lg font-medium">
                            {(
                              test.duration_minutes / test.question_count
                            ).toFixed(1)}{" "}
                            min
                          </p>
                        </div>
                      )}
                      {isPrelims && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Negative Marking
                          </p>
                          <p className="text-lg font-medium">
                            {test.negative_marking}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading & Summary Tab */}
        <TabsContent value="grading" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Grading & Summary</CardTitle>
              <CardDescription>
                Configure pass marks and grading criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-xl">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-4">Pass Mark</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={gradingSettings.pass_mark_value}
                        onChange={(e) =>
                          setGradingSettings({
                            ...gradingSettings,
                            pass_mark_value: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter pass mark value"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={gradingSettings.pass_mark_unit}
                        onValueChange={(v) =>
                          setGradingSettings({
                            ...gradingSettings,
                            pass_mark_unit: v as
                              | "percentage"
                              | "grade"
                              | "point",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="grade">Grade</SelectItem>
                          <SelectItem value="point">Point</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                    <p className="text-xl font-bold">{test.total_marks}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Questions
                    </p>
                    <p className="text-xl font-bold">{test.question_count}</p>
                  </div>
                  {isPrelims && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Negative Marking
                      </p>
                      <p className="text-xl font-bold">
                        {test.negative_marking} per wrong answer
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pass Mark</p>
                    <p className="text-xl font-bold">
                      {gradingSettings.pass_mark_value}{" "}
                      {gradingSettings.pass_mark_unit}
                    </p>
                  </div>
                </div>

                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={async () => {
                    try {
                      await dispatch(
                        updateTest({
                          id: testId,
                          data: {
                            passing_marks: gradingSettings.pass_mark_value,
                            pass_mark_unit: gradingSettings.pass_mark_unit,
                          } as any,
                        }),
                      ).unwrap();
                      toast({
                        title: "Grading settings saved",
                        description: `Pass mark: ${gradingSettings.pass_mark_value} ${gradingSettings.pass_mark_unit}`,
                      });
                    } catch {
                      toast({
                        title: "Failed to save grading settings",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Grading Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                View all student results for this test (
                {studentsWithStatus.length} students)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsWithStatus.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Roll Number</th>
                        <th className="text-left py-3 px-4">Student Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Status</th>
                        {isPrelims && (
                          <th className="text-left py-3 px-4">Score</th>
                        )}
                        {isPrelims && (
                          <th className="text-left py-3 px-4">Result</th>
                        )}
                        <th className="text-left py-3 px-4">Submitted At</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithStatus.map((student) => {
                        const hasAttempted =
                          student.attempt_status &&
                          student.attempt_status !== AttemptStatus.NOT_STARTED;
                        const isEvaluated =
                          student.attempt_status === AttemptStatus.EVALUATED;
                        const isSubmitted =
                          student.attempt_status === AttemptStatus.SUBMITTED ||
                          isEvaluated;

                        return (
                          <tr
                            key={student.student_id}
                            className="border-b hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              if (student.attempt_id) {
                                window.location.href = `/dashboard/tests/${testId}/attempts/${student.attempt_id}`;
                              }
                            }}
                          >
                            <td className="py-3 px-4 font-medium">
                              {student.student_roll_number}
                            </td>
                            <td className="py-3 px-4">
                              {student.student_name}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {student.student_email}
                            </td>
                            <td className="py-3 px-4">
                              {hasAttempted ? (
                                getAttemptStatusBadge(student.attempt_status!)
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100"
                                >
                                  Unattempted
                                </Badge>
                              )}
                            </td>
                            {isPrelims && (
                              <td className="py-3 px-4">
                                {isEvaluated &&
                                student.score !== null &&
                                student.score !== undefined
                                  ? test.pass_mark_unit === "percentage"
                                    ? `${student.percentage?.toFixed(1)}%`
                                    : `${student.score}/${test.total_marks}`
                                  : "-"}
                              </td>
                            )}
                            {isPrelims && (
                              <td className="py-3 px-4">
                                {isEvaluated &&
                                student.score !== null &&
                                student.score !== undefined ? (
                                  (test.pass_mark_unit === "percentage"
                                    ? (student.percentage ?? 0) >= (test.passing_marks || 0)
                                    : student.score >= (test.passing_marks || 0)) ? (
                                    <Badge className="bg-green-500">Pass</Badge>
                                  ) : (
                                    <Badge variant="destructive">Fail</Badge>
                                  )
                                ) : (
                                  "-"
                                )}
                              </td>
                            )}
                            <td className="py-3 px-4 text-sm">
                              {student.submitted_at
                                ? new Date(
                                    student.submitted_at,
                                  ).toLocaleString()
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {student.attempt_id ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/dashboard/tests/${testId}/attempts/${student.attempt_id}`;
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No students assigned to this test.</p>
                  <p className="text-sm">
                    Assign batches or individual students in the Settings tab.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Question Number</Label>
                <Input
                  type="number"
                  value={newQuestion.question_number}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      question_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Marks</Label>
                <Input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      marks: parseFloat(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Correct Option</Label>
                <Select
                  value={newQuestion.correct_option.toString()}
                  onValueChange={(v) =>
                    setNewQuestion({
                      ...newQuestion,
                      correct_option: parseInt(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                    <SelectItem value="3">Option 3</SelectItem>
                    <SelectItem value="4">Option 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject & Topic */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject *</Label>
                <Select
                  value={newQuestion.subject_id?.toString() || ""}
                  onValueChange={(v) =>
                    setNewQuestion({
                      ...newQuestion,
                      subject_id: v ? parseInt(v) : null,
                      topic_id: null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {testSubjectsTopics.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Topic *</Label>
                {!newQuestion.subject_id ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a subject first
                  </p>
                ) : (
                  <Select
                    value={newQuestion.topic_id?.toString() || ""}
                    onValueChange={(v) =>
                      setNewQuestion({
                        ...newQuestion,
                        topic_id: v ? parseInt(v) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {testSubjectsTopics
                        .find((s) => s.id === newQuestion.subject_id)
                        ?.topics.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <Label>Question Text *</Label>
              <Textarea
                value={newQuestion.question_text}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    question_text: e.target.value,
                  })
                }
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      newQuestion.correct_option === idx + 1
                        ? "bg-green-500 text-white"
                        : "bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <Input
                    value={opt.option_text}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[idx] = {
                        ...newOptions[idx],
                        option_text: e.target.value,
                      };
                      setNewQuestion({ ...newQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Solution (optional)</Label>
              <Textarea
                value={newQuestion.solution}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, solution: e.target.value })
                }
                placeholder="Explain the correct answer..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddQuestion(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={
                !newQuestion.question_text ||
                newQuestion.options.some((o) => !o.option_text) ||
                !newQuestion.subject_id ||
                !newQuestion.topic_id
              }
            >
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Questions Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or JSON file with questions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop
                </p>
                {importFile && (
                  <Badge variant="secondary" className="mt-2">
                    {importFile.name}
                  </Badge>
                )}
              </label>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Excel format:</p>
              <p>
                Columns: question_number, question_text, option_1, option_2,
                option_3, option_4, correct_option, marks, solution,
                subject_name, topic_name
              </p>
              <p className="text-xs mt-1 text-amber-600">
                subject_name and topic_name must match existing subjects and
                topics in the course.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImportQuestions} disabled={!importFile}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload PDF Dialog (Mains) */}
      <Dialog open={showUploadPdf} onOpenChange={setShowUploadPdf}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Question Paper</DialogTitle>
            <DialogDescription>
              Upload a PDF file containing the test questions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-file"
              />
              <label
                htmlFor="pdf-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop
                </p>
                {pdfFile && (
                  <Badge variant="secondary" className="mt-2">
                    {pdfFile.name}
                  </Badge>
                )}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadPdf(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadPdf} disabled={!pdfFile || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  onDelete,
}: {
  question: TestQuestion;
  index: number;
  onDelete: () => void;
}) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <Card className="bg-white/80">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
              {question.question_number}
            </span>
            <Badge variant="outline">{question.marks} marks</Badge>
            {question.subject_name && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 text-xs"
              >
                {question.subject_name}
              </Badge>
            )}
            {question.topic_name && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 text-xs"
              >
                {question.topic_name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <p className="mb-4 font-medium">{question.question_text}</p>

        <div className="grid grid-cols-2 gap-2">
          {question.options.map((opt) => (
            <div
              key={opt.id}
              className={`p-2 rounded border ${
                opt.option_number === question.correct_option
                  ? "border-green-500 bg-green-50"
                  : "border-slate-200"
              }`}
            >
              <span className="flex items-center gap-2">
                {opt.option_number === question.correct_option ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-xs">
                    {opt.option_number}
                  </span>
                )}
                {opt.option_text}
              </span>
            </div>
          ))}
        </div>

        {question.solution && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
              className="text-blue-600"
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </Button>
            {showSolution && (
              <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                {question.solution}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
