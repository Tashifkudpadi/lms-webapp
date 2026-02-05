"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Calendar,
  Users,
  Star,
  Play,
  CheckCircle,
  Lock,
  FileText,
  Download,
  MessageSquare,
  BookOpen,
  Award,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, use as usePromise } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourseById } from "@/store/courses";
import ContentsTab from "@/app/dashboard/courses/tabs/ContentsTab";
import LearnersTab from "@/app/dashboard/courses/tabs/LearnersTab";
import BatchesTab from "@/app/dashboard/courses/tabs/BatchesTab";
import TestsTab from "@/app/dashboard/courses/tabs/TestsTab";
import AssignmentsTab from "@/app/dashboard/courses/tabs/AssignmentsTab";
import SettingsTab from "@/app/dashboard/courses/tabs/SettingsTab";

export default function ViewCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const dispatch = useAppDispatch();
  const { selected, loading } = useAppSelector((state) => state.coursesReducer);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id));
    }
  }, [dispatch, id]);

  // Normalize the API response to the UI shape with safe fallbacks
  const course = useMemo(() => {
    const c: any = selected || {};
    return {
      id: c.id ?? id,
      title: c.course_name ?? c.title ?? "",
      description: c.course_desc ?? c.description ?? "",
      instructor: {
        name: c.instructor_name ?? c.instructor?.name ?? "",
        title: c.instructor_title ?? c.instructor?.title ?? "",
        avatar: c.instructor_avatar ?? c.instructor?.avatar ?? "/placeholder.svg",
        rating: c.instructor_rating ?? c.instructor?.rating ?? "",
        students: c.instructor_students ?? c.instructor?.students ?? "",
      },
      students: c.students ?? "",
      startDate: c.start_date ?? c.created_at ?? "",
      totalContents: c.total_contents ?? "",
      totalAssignments: c.total_assignments ?? "",
      totalTests: c.total_tests ?? "",
    };
  }, [selected, id]);

  const lessons = [
    {
      id: 1,
      title: "Introduction to HTML",
      duration: "15 min",
      type: "video",
      completed: true,
      locked: false,
    },
    {
      id: 2,
      title: "HTML Structure and Elements",
      duration: "22 min",
      type: "video",
      completed: true,
      locked: false,
    },
    {
      id: 3,
      title: "HTML Forms and Input Types",
      duration: "18 min",
      type: "video",
      completed: true,
      locked: false,
    },
    {
      id: 4,
      title: "HTML Quiz",
      duration: "10 min",
      type: "quiz",
      completed: true,
      locked: false,
    },
    {
      id: 5,
      title: "Introduction to CSS",
      duration: "20 min",
      type: "video",
      completed: true,
      locked: false,
    },
    {
      id: 6,
      title: "CSS Selectors and Properties",
      duration: "25 min",
      type: "video",
      completed: true,
      locked: false,
    },
    {
      id: 7,
      title: "CSS Flexbox Layout",
      duration: "30 min",
      type: "video",
      completed: false,
      locked: false,
    },
    {
      id: 8,
      title: "CSS Grid System",
      duration: "28 min",
      type: "video",
      completed: false,
      locked: false,
    },
    {
      id: 9,
      title: "Responsive Design Principles",
      duration: "35 min",
      type: "video",
      completed: false,
      locked: true,
    },
    {
      id: 10,
      title: "CSS Assignment",
      duration: "45 min",
      type: "assignment",
      completed: false,
      locked: true,
    },
  ];

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative">
      {/* Dots Background Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)`,
          backgroundSize: "35px 35px",
          backgroundPosition: "0 0, 17.5px 17.5px",
        }}
      ></div>

      <div className="relative z-10">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-white/70 backdrop-blur-sm border-blue-200 text-blue-800 hover:bg-blue-50"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>

        {/* Course Header */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl p-8 text-white">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2"></div>
                <h1 className="text-4xl font-bold text-white">
                  {course.title}
                </h1>
                <p className="text-lg text-blue-100">{course.description}</p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white">
                    {course.totalContents}
                  </div>
                  <div className="text-sm text-blue-100">Contents</div>
                </div>

                <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white">
                    {course.students}
                  </div>
                  <div className="text-sm text-blue-100">Students</div>
                </div>
                <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white">
                    {course.totalTests}
                  </div>
                  <div className="text-sm text-blue-100">Tests</div>
                </div>
                <div className="text-center p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white">
                    {course.totalAssignments}
                  </div>
                  <div className="text-sm text-blue-100">Assignments</div>
                </div>
              </div>
            </div>

            {/* Instructor Card */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-xl border border-blue-200 shadow-xl">
                <CardHeader className="text-center">
                  <Avatar className="h-20 w-20 mx-auto ring-4 ring-white/30">
                    <AvatarImage
                      src={course.instructor.avatar || "/placeholder.svg"}
                      alt={course.instructor.name || "Instructor"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                      {(course.instructor.name || "").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-slate-900">
                    {course.instructor.name}
                  </CardTitle>
                  <CardDescription className="text-slate-700">
                    {course.instructor.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Instructor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200 shadow-2xl p-6">
          <Tabs defaultValue="contents" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-blue-100 to-purple-100 backdrop-blur-sm border border-blue-200 rounded-xl p-1 shadow-lg">
              <TabsTrigger
                value="contents"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Contents
              </TabsTrigger>
              <TabsTrigger
                value="learners"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Learners
              </TabsTrigger>
              <TabsTrigger
                value="batches"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Batches
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Tests
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Assignments
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            {/* contents Tab */}
            <TabsContent value="contents" className="mt-6">
              <ContentsTab lessons={lessons} courseId={id} />
            </TabsContent>

            {/* learners Tab */}
            <TabsContent value="learners" className="mt-6">
              <LearnersTab courseId={id} />
            </TabsContent>

            {/* batches Tab */}
            <TabsContent value="batches" className="mt-6">
              <BatchesTab courseId={id} />
            </TabsContent>

            {/* tests Tab */}
            <TabsContent value="tests" className="mt-6">
              <TestsTab courseId={id} />
            </TabsContent>

            {/* assignments Tab */}
            <TabsContent value="assignments" className="mt-6">
              <AssignmentsTab />
            </TabsContent>

            {/* settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <SettingsTab courseId={id} course={course} selected={selected} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
