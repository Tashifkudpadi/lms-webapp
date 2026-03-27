"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, TrendingUp, GalleryHorizontalEnd, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import CreateCourseForm from "@/components/create-course-form";
import Image from "next/image";
import { useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { PaginationControls } from "@/components/pagination-controls";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.authReducer);
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("all");
  const allPagination = useServerPagination<any>(
    "/courses",
    9,
    undefined,
    activeTab === "all",
  );
  const publicPagination = useServerPagination<any>(
    "/courses?is_public=true",
    9,
    undefined,
    activeTab === "public",
  );
  const deletedPagination = useServerPagination<any>(
    "/courses?is_active=false",
    9,
    undefined,
    activeTab === "deleted",
  );

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 relative">
      {/* Dots Background Pattern */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
              <TrendingUp className="w-4 h-4" />
              Dashboard Overview
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Courses Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track your course progress
            </p>
          </div>
          {isAdmin && (
            <CreateCourseForm onSuccess={() => allPagination.refetch()}>
              <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-700 hover:to-blue-500 text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Create New Course
              </Button>
            </CreateCourseForm>
          )}
        </div>
        {/* Tabs */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <Tabs
              defaultValue="all"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"} bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200`}>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
                >
                  All Courses
                </TabsTrigger>
                <TabsTrigger
                  value="public"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
                >
                  Public
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="deleted"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-400 data-[state=active]:text-white"
                  >
                    Deleted
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Search Bar */}
              <div className="relative mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={
                    activeTab === "all"
                      ? allPagination.search
                      : activeTab === "public"
                        ? publicPagination.search
                        : deletedPagination.search
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeTab === "all") allPagination.setSearch(val);
                    else if (activeTab === "public") publicPagination.setSearch(val);
                    else deletedPagination.setSearch(val);
                  }}
                  className="pl-10 bg-white/60"
                />
              </div>

              {/* All */}
              <TabsContent value="all" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allPagination.items.map((course: any) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                <PaginationControls
                  currentPage={allPagination.currentPage}
                  totalPages={allPagination.totalPages}
                  totalItems={allPagination.totalItems}
                  startIndex={allPagination.startIndex}
                  endIndex={allPagination.endIndex}
                  onPageChange={allPagination.setCurrentPage}
                  itemLabel="courses"
                />
              </TabsContent>

              {/* Public = is_public */}
              <TabsContent value="public" className="space-y-4 mt-6">
                {!publicPagination.loading &&
                publicPagination.totalItems === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No public courses
                  </p>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {publicPagination.items.map((course: any) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={publicPagination.currentPage}
                      totalPages={publicPagination.totalPages}
                      totalItems={publicPagination.totalItems}
                      startIndex={publicPagination.startIndex}
                      endIndex={publicPagination.endIndex}
                      onPageChange={publicPagination.setCurrentPage}
                      itemLabel="courses"
                    />
                  </>
                )}
              </TabsContent>

              {/* Deleted = !is_active */}
              <TabsContent value="deleted" className="space-y-4 mt-6">
                {!deletedPagination.loading &&
                deletedPagination.totalItems === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No deleted courses
                  </p>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {deletedPagination.items.map((course: any) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={deletedPagination.currentPage}
                      totalPages={deletedPagination.totalPages}
                      totalItems={deletedPagination.totalItems}
                      startIndex={deletedPagination.startIndex}
                      endIndex={deletedPagination.endIndex}
                      onPageChange={deletedPagination.setCurrentPage}
                      itemLabel="courses"
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={course.course_img || "/placeholder.svg"}
          alt={course.title || "Course Thumbnail"}
          fill
          className="object-cover"
        />
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">
          {course.course_name}
        </CardTitle>
        <CardDescription>{course.course_desc}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <GalleryHorizontalEnd className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {course.batches} batches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatDate(course.created_at)}
              </span>
            </div>
            {/* <div className="flex items-center gap-2 col-span-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {course.students} students enrolled
                </span>
              </div> */}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-100 to-blue-100"
              asChild
            >
              <Link href={`/dashboard/courses/${course.id}`}>View Course</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
