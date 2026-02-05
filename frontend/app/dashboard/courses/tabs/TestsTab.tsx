"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  FileText,
  Eye,
  BookOpen,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchMyTests,
  TestCategory,
  TestStatus,
  TestListItem,
  ExamType,
} from "@/store/tests";
import Link from "next/link";

interface TestsTabProps {
  courseId: string;
}

export default function TestsTab({ courseId }: TestsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { tests, loading } = useSelector(
    (state: RootState) => state.testsReducer
  );

  const [selectedExamType, setSelectedExamType] = useState<ExamType>(
    ExamType.UPSC
  );
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>(
    TestCategory.PRELIMS
  );

  // Fetch tests for this course on mount
  useEffect(() => {
    dispatch(fetchMyTests({ course_id: Number(courseId) }));
  }, [dispatch, courseId]);

  // Filter by exam type and category (backend already filtered by course_id)
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
        return <Badge variant="secondary">Draft</Badge>;
      case TestStatus.PUBLISHED:
        return <Badge className="bg-green-500">Published</Badge>;
      case TestStatus.ARCHIVED:
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tests...</p>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Tests Assigned</h3>
        <p className="text-muted-foreground mb-4">
          No tests have been mapped to this course yet.
        </p>
        <Button asChild>
          <Link href="/dashboard/tests">
            <BookOpen className="w-4 h-4 mr-2" />
            Go to Tests
          </Link>
        </Button>
      </div>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTests.map((test) => (
                    <Card
                      key={test.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow bg-white"
                    >
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
                                {selectedCategory === TestCategory.MAINS
                                  ? "PDF Test"
                                  : `${test.question_count} questions`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {test.total_marks} marks
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/tests/${test.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
    </div>
  );
}
