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
  Calendar,
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  BookOpen,
  FolderPlus,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchMyTests,
  fetchSubCategories,
  createTest,
  createSubCategory,
  deleteTest,
  ExamType,
  TestCategory,
  TestStatus,
  TestListItem,
} from "@/store/tests";
import { fetchBatches } from "@/store/batches";
import { fetchCourses } from "@/store/courses";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";

export default function TestsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const testsState = useSelector((state: RootState) => state.testsReducer);
  const tests = testsState?.tests || [];
  const subCategories = testsState?.subCategories || [];
  const loading = testsState?.loading || false;
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

  const [selectedExamType, setSelectedExamType] = useState<ExamType>(
    ExamType.UPSC,
  );
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>(
    TestCategory.PRELIMS,
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);

  // Form states
  const [newTest, setNewTest] = useState({
    test_name: "",
    description: "",
    exam_type: ExamType.UPSC,
    category: TestCategory.PRELIMS,
    sub_category_id: null as number | null,
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 40,
    negative_marking: 0.25,
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

  // Fetch only tests and sub-categories on mount
  useEffect(() => {
    dispatch(fetchMyTests());
    dispatch(fetchSubCategories());
  }, [dispatch]);

  // Fetch batches, courses, students, and faculties when create test dialog opens
  useEffect(() => {
    if (showCreateTest) {
      dispatch(fetchBatches());
      dispatch(fetchCourses());
      dispatch(fetchStudents());
      dispatch(fetchFaculties());
    }
  }, [showCreateTest, dispatch]);

  // Filter tests based on selections
  const filteredTests = tests.filter((test) => {
    const matchesExamType = test.exam_type === selectedExamType;
    const matchesCategory = test.category === selectedCategory;
    const matchesSubCategory =
      !selectedSubCategory ||
      test.sub_category_name ===
        subCategories.find((sc) => sc.id === selectedSubCategory)?.name;
    const matchesSearch =
      !searchQuery ||
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      matchesExamType && matchesCategory && matchesSubCategory && matchesSearch
    );
  });

  // Filter sub-categories by exam type
  const filteredSubCategories = subCategories.filter(
    (sc) => sc.exam_type === selectedExamType,
  );

  const handleCreateTest = async () => {
    try {
      await dispatch(
        createTest({
          ...newTest,
          sub_category_id:
            selectedCategory === TestCategory.PRELIMS
              ? newTest.sub_category_id
              : undefined,
        }),
      ).unwrap();
      setShowCreateTest(false);
      setNewTest({
        test_name: "",
        description: "",
        exam_type: selectedExamType,
        category: selectedCategory,
        sub_category_id: null,
        duration_minutes: 60,
        total_marks: 100,
        passing_marks: 40,
        negative_marking: 0.25,
        instructions: "",
        batch_ids: [],
        student_ids: [],
        faculty_ids: [],
        course_ids: [],
      });
      dispatch(fetchMyTests());
    } catch (err) {
      console.error("Failed to create test:", err);
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      await dispatch(createSubCategory(newSubCategory)).unwrap();
      setShowCreateSubCategory(false);
      setNewSubCategory({
        name: "",
        description: "",
        exam_type: selectedExamType,
      });
    } catch (err) {
      console.error("Failed to create sub-category:", err);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      try {
        await dispatch(deleteTest(testId)).unwrap();
      } catch (err) {
        console.error("Failed to delete test:", err);
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

  const openCreateTestDialog = () => {
    setNewTest({
      ...newTest,
      exam_type: selectedExamType,
      category: selectedCategory,
      sub_category_id: selectedSubCategory,
    });
    setShowCreateTest(true);
  };

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative p-6">
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
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
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
          value={selectedExamType}
          onValueChange={(v) => {
            setSelectedExamType(v as ExamType);
            setSelectedSubCategory(null);
          }}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-gradient-to-r from-blue-100 to-purple-100">
            <TabsTrigger value={ExamType.UPSC} className="font-semibold">
              UPSC
            </TabsTrigger>
            <TabsTrigger value={ExamType.TNPSC} className="font-semibold">
              TNPSC
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedExamType} className="mt-6">
            {/* Category Tabs (Prelims / Mains) */}
            <Tabs
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v as TestCategory);
                setSelectedSubCategory(null);
              }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <TabsList className="bg-white shadow-sm">
                  <TabsTrigger value={TestCategory.PRELIMS}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Prelims
                  </TabsTrigger>
                  <TabsTrigger value={TestCategory.MAINS}>
                    <FileText className="w-4 h-4 mr-2" />
                    Mains
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  {selectedCategory === TestCategory.PRELIMS && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewSubCategory({
                          ...newSubCategory,
                          exam_type: selectedExamType,
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                </div>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tests Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      Loading tests...
                    </div>
                  ) : filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        onDelete={() => handleDeleteTest(test.id)}
                        getStatusBadge={getStatusBadge}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      No tests found. Create your first test!
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Mains Content */}
              <TabsContent value={TestCategory.MAINS} className="space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tests Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      Loading tests...
                    </div>
                  ) : filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <TestCard
                        key={test.id}
                        test={test}
                        onDelete={() => handleDeleteTest(test.id)}
                        getStatusBadge={getStatusBadge}
                        isMains
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      No tests found. Create your first test!
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Test Dialog */}
      <Dialog open={showCreateTest} onOpenChange={setShowCreateTest}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New{" "}
              {selectedCategory === TestCategory.PRELIMS ? "Prelims" : "Mains"}{" "}
              Test
            </DialogTitle>
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

              {selectedCategory === TestCategory.PRELIMS &&
                filteredSubCategories.length > 0 && (
                  <div>
                    <Label>Sub-Category</Label>
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
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubCategories.map((sc) => (
                          <SelectItem key={sc.id} value={sc.id.toString()}>
                            {sc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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

              {selectedCategory === TestCategory.PRELIMS && (
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
                            className="cursor-pointer bg-blue-50"
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
                    <Label>Faculties</Label>
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
                          .filter(
                            (f: any) => !newTest.faculty_ids.includes(f.id),
                          )
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
                            onClick={() =>
                              setNewTest({
                                ...newTest,
                                course_ids: newTest.course_ids.filter(
                                  (cid) => cid !== id,
                                ),
                              })
                            }
                          >
                            {course?.course_name} x
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTest(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTest}
              disabled={!newTest.test_name}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
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
              Create Sub-Category for {selectedExamType}
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
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Create
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
  getStatusBadge,
  isMains = false,
}: {
  test: TestListItem;
  onDelete: () => void;
  getStatusBadge: (status: TestStatus) => React.ReactNode;
  isMains?: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-2">
              {test.test_name}
            </CardTitle>
            {test.sub_category_name && (
              <Badge variant="outline" className="text-xs">
                {test.sub_category_name}
              </Badge>
            )}
          </div>
          {getStatusBadge(test.status)}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {test.duration_minutes
                  ? `${test.duration_minutes} min`
                  : "No limit"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isMains ? "PDF Test" : `${test.question_count} questions`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {test.total_marks} marks
              </span>
            </div>
            {test.start_datetime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  {new Date(test.start_datetime).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" asChild>
              <a href={`/dashboard/tests/${test.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/dashboard/tests/${test.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
