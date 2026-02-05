"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, BookOpen, Globe, ImageIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { fetchBatches } from "@/store/batches";
import { fetchSubjects } from "@/store/subjects";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { MultiSelect } from "@/components/ui/multi-select"; // ✅ your component
import { clearError, createCourse } from "@/store/courses";

interface CreateCourseFormProps {
  children: React.ReactNode;
}

export default function CreateCourseForm({ children }: CreateCourseFormProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courseImage, setCourseImage] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);

  // ✅ selections state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  // ✅ get data from Redux store
  const students = useAppSelector(
    (state: RootState) => state.studentsReducer.students
  );
  const faculties = useAppSelector(
    (state: RootState) => state.facultyReducer.faculty
  );
  const batches = useAppSelector(
    (state: RootState) => state.batchesReducer.batches
  );
  const subjects = useAppSelector(
    (state: RootState) => state.subjectsReducer.subjects
  );
  const { error } = useAppSelector((state: RootState) => state.coursesReducer);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchBatches());
    dispatch(fetchSubjects());
    dispatch(fetchStudents());
    dispatch(fetchFaculties());
  }, [dispatch, open]);

  console.log(
    selectedStudents,
    selectedFaculties,
    selectedSubjects,
    selectedBatches
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const payload = {
      course_name: (event.target as any).title.value,
      course_desc: (event.target as any).description.value,
      student_ids: selectedStudents.map((id) => Number(id)),
      faculty_ids: selectedFaculties.map((id) => Number(id)),
      subject_ids: selectedSubjects.map((id) => Number(id)),
      batch_ids: selectedBatches.map((id) => Number(id)),
      is_active: true,
      is_public: isPublic,
      course_img: courseImage,
    };

    try {
      await dispatch(createCourse(payload)).unwrap();

      setIsLoading(false);
      setOpen(false);
      setSelectedBatches([]);
      setSelectedFaculties([]);
      setSelectedStudents([]);
      setSelectedSubjects([]);
      setCourseImage("");
    } catch (err) {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          dispatch(clearError()); // ✅ clear error when dialog closes
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Create New Course
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Course Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* title + code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input id="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input id="code" required />
                </div>
              </div>

              {/* description */}
              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea id="description" required />
              </div>

              {/* ✅ multi-selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Students *</Label>
                  <MultiSelect
                    options={students.map((s) => ({
                      label: s.name,
                      value: s.id.toString(),
                    }))}
                    selected={selectedStudents}
                    onChange={setSelectedStudents}
                    placeholder="Select students..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Faculties *</Label>
                  <MultiSelect
                    options={faculties.map((f) => ({
                      label: f.name,
                      value: f.id.toString(),
                    }))}
                    selected={selectedFaculties}
                    onChange={setSelectedFaculties}
                    placeholder="Select faculties..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subjects *</Label>
                  <MultiSelect
                    options={subjects.map((sub) => ({
                      label: sub.name,
                      value: sub.id.toString(),
                    }))}
                    selected={selectedSubjects}
                    onChange={setSelectedSubjects}
                    placeholder="Select subjects..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batches *</Label>
                  <MultiSelect
                    options={batches.map((b) => ({
                      label: b.name,
                      value: b.id.toString(),
                    }))}
                    selected={selectedBatches}
                    onChange={setSelectedBatches}
                    placeholder="Select batches..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Course visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">
                        Public Course
                      </Label>
                      <p className="text-sm text-slate-600">
                        Make this course visible to all users
                      </p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />{" "}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Course Image
                    </Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white/30">
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="mt-2">
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Form Actions */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                dispatch(clearError()); // ✅ clear error when dialog closes
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Course...
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
