"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteCourse, updateCourse } from "@/store/courses";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/ui/multi-select";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { fetchSubjects } from "@/store/subjects";
import { fetchBatches } from "@/store/batches";

interface SettingsTabProps {
  courseId: string;
  course: any; // normalized course used in UI
  selected: any; // raw selected from API (for is_public, course_img, etc.)
}

export default function SettingsTab({ courseId, course, selected }: SettingsTabProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const students = useAppSelector((s: any) => s.studentsReducer.students);
  const faculties = useAppSelector((s: any) => s.facultyReducer.faculty);
  const subjects = useAppSelector((s: any) => s.subjectsReducer.subjects);
  const batches = useAppSelector((s: any) => s.batchesReducer.batches);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    setTitle(course?.title || "");
    setDescription(course?.description || "");
    setIsPublic(!!selected?.is_public);
    setImageUrl(selected?.course_img || "");
    // initialize selected ids from API response arrays
    setSelectedStudents((selected?.student_ids || []).map((id: number) => String(id)));
    setSelectedFaculties((selected?.faculty_ids || []).map((id: number) => String(id)));
    setSelectedSubjects((selected?.subject_ids || []).map((id: number) => String(id)));
    setSelectedBatches((selected?.batch_ids || []).map((id: number) => String(id)));
  }, [course?.title, course?.description, selected?.is_public, selected?.course_img
  , selected?.student_ids, selected?.faculty_ids, selected?.subject_ids, selected?.batch_ids
  ]);

  // Load options lists
  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchFaculties());
    dispatch(fetchSubjects());
    dispatch(fetchBatches());
  }, [dispatch]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      course_name: title,
      course_desc: description,
      is_public: isPublic,
      course_img: imageUrl,
      student_ids: selectedStudents.map((id) => Number(id)),
      faculty_ids: selectedFaculties.map((id) => Number(id)),
      subject_ids: selectedSubjects.map((id) => Number(id)),
      batch_ids: selectedBatches.map((id) => Number(id)),
    };
    try {
      await dispatch(updateCourse({ id: courseId, payload })).unwrap();
    } catch (err) {
      // store handles error
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Are you sure you want to delete this course? This action cannot be undone.");
    if (!ok) return;
    try {
      await dispatch(deleteCourse(courseId)).unwrap();
      router.push("/dashboard");
    } catch (err) {
      // store handles error
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border border-blue-200 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-900">Course Settings</CardTitle>
          <CardDescription>Update basic course details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle">Course Title *</Label>
                <Input id="courseTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseImage">Course Image URL</Label>
                <Input
                  id="courseImage"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseDesc">Short Description *</Label>
              <Textarea id="courseDesc" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-slate-700 font-medium">Public Course</Label>
                <p className="text-sm text-slate-600">Make this course visible to all users</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {/* Current selections as names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Students in this course</Label>
                <div className="text-sm text-slate-700">
                  {(selected?.student_ids || [])
                    .map((id: number) => students.find((s: any) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Faculties for this course</Label>
                <div className="text-sm text-slate-700">
                  {(selected?.faculty_ids || [])
                    .map((id: number) => faculties.find((f: any) => f.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subjects in this course</Label>
                <div className="text-sm text-slate-700">
                  {(selected?.subject_ids || [])
                    .map((id: number) => subjects.find((s: any) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Batches in this course</Label>
                <div className="text-sm text-slate-700">
                  {(selected?.batch_ids || [])
                    .map((id: number) => batches.find((b: any) => b.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </div>
            </div>

            {/* Editable MultiSelects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Students</Label>
                <MultiSelect
                  options={students.map((s: any) => ({ label: s.name, value: String(s.id) }))}
                  selected={selectedStudents}
                  onChange={setSelectedStudents}
                  placeholder="Select students..."
                />
              </div>
              <div className="space-y-2">
                <Label>Faculties</Label>
                <MultiSelect
                  options={faculties.map((f: any) => ({ label: f.name, value: String(f.id) }))}
                  selected={selectedFaculties}
                  onChange={setSelectedFaculties}
                  placeholder="Select faculties..."
                />
              </div>
              <div className="space-y-2">
                <Label>Subjects</Label>
                <MultiSelect
                  options={subjects.map((s: any) => ({ label: s.name, value: String(s.id) }))}
                  selected={selectedSubjects}
                  onChange={setSelectedSubjects}
                  placeholder="Select subjects..."
                />
              </div>
              <div className="space-y-2">
                <Label>Batches</Label>
                <MultiSelect
                  options={batches.map((b: any) => ({ label: b.name, value: String(b.id) }))}
                  selected={selectedBatches}
                  onChange={setSelectedBatches}
                  placeholder="Select batches..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete Course
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
