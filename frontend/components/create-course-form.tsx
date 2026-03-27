"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
import {
  Plus,
  Upload,
  BookOpen,
  Globe,
  ImageIcon,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { fetchBatches, Batch } from "@/store/batches";
import { fetchStudents } from "@/store/students";
import { fetchFaculties } from "@/store/faculties";
import { fetchSubjects } from "@/store/subjects";
import { MultiSelect } from "@/components/ui/multi-select"; // ✅ your component
import { clearError, createCourse } from "@/store/courses";
import { uploadToMinio } from "@/utils/uploadToMinio";
import Image from "next/image";

interface CreateCourseFormProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateCourseForm({ children, onSuccess }: CreateCourseFormProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courseImage, setCourseImage] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ selections state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  // ✅ get data from Redux store
  const subjects = useAppSelector(
    (state: RootState) => state.subjectsReducer.subjects,
  );
  const students = useAppSelector(
    (state: RootState) => state.studentsReducer.students,
  );
  const faculties = useAppSelector(
    (state: RootState) => state.facultyReducer.faculty,
  );
  const batches = useAppSelector(
    (state: RootState) => state.batchesReducer.batches,
  );
  const { error } = useAppSelector((state: RootState) => state.coursesReducer);

  // Filter faculties to only those mapped to selected subjects
  const filteredFaculties = useMemo(() => {
    if (selectedSubjects.length === 0) return [];
    const subjectIdSet = new Set(selectedSubjects.map(Number));
    return faculties.filter((f) =>
      f.subject_ids?.some((sid) => subjectIdSet.has(sid)),
    );
  }, [faculties, selectedSubjects]);

  // Check for batch faculty conflicts
  const batchFacultyWarning = useMemo(() => {
    if (selectedBatches.length === 0 || selectedSubjects.length === 0)
      return null;
    const filteredFacultyIds = new Set(filteredFaculties.map((f) => f.id));
    const unmappedFaculties: { batchName: string; facultyNames: string[] }[] =
      [];

    for (const batchIdStr of selectedBatches) {
      const batch = batches.find((b) => b.id === Number(batchIdStr));
      if (!batch?.faculty_ids?.length) continue;
      const missing = batch.faculty_ids
        .filter((fid) => !filteredFacultyIds.has(fid))
        .map((fid) => faculties.find((f) => f.id === fid)?.name)
        .filter(Boolean) as string[];
      if (missing.length > 0) {
        unmappedFaculties.push({
          batchName: batch.name,
          facultyNames: missing,
        });
      }
    }
    return unmappedFaculties.length > 0 ? unmappedFaculties : null;
  }, [
    selectedBatches,
    selectedSubjects,
    batches,
    faculties,
    filteredFaculties,
  ]);

  // When subjects change, remove any selected faculties that are no longer in the filtered list
  useEffect(() => {
    if (selectedSubjects.length === 0) {
      setSelectedFaculties([]);
      return;
    }
    const filteredIds = new Set(filteredFaculties.map((f) => f.id.toString()));
    setSelectedFaculties((prev) => prev.filter((id) => filteredIds.has(id)));
  }, [selectedSubjects, filteredFaculties]);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchSubjects());
    dispatch(fetchBatches());
    dispatch(fetchStudents());
    dispatch(fetchFaculties());
  }, [dispatch, open]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { fileUrl } = await uploadToMinio(file);
      setCourseImage(fileUrl);
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setCourseImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const payload = {
      course_name: (event.target as any).title.value,
      course_desc: (event.target as any).description.value,
      subject_ids: selectedSubjects.map((id) => Number(id)),
      student_ids: selectedStudents.map((id) => Number(id)),
      faculty_ids: selectedFaculties.map((id) => Number(id)),
      batch_ids: selectedBatches.map((id) => Number(id)),
      is_active: true,
      is_public: isPublic,
      course_img: courseImage,
    };

    try {
      await dispatch(createCourse(payload)).unwrap();

      setIsLoading(false);
      setOpen(false);
      toast({ title: "Course created successfully", variant: "success" });
      onSuccess?.();
      setSelectedSubjects([]);
      setSelectedBatches([]);
      setSelectedFaculties([]);
      setSelectedStudents([]);
      setCourseImage("");
    } catch (err: any) {
      setIsLoading(false);
      toast({ title: "Failed to create course", description: err?.response?.data?.detail || err?.message || "Something went wrong", variant: "destructive" });
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
                <BookOpen className="w-5 h-5 text-indigo-600" />
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
                  <Label>Subjects *</Label>
                  <MultiSelect
                    options={subjects.map((s) => ({
                      label: s.name,
                      value: s.id.toString(),
                    }))}
                    selected={selectedSubjects}
                    onChange={setSelectedSubjects}
                    placeholder="Select subjects..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Faculties *</Label>
                  <MultiSelect
                    options={filteredFaculties.map((f) => ({
                      label: f.name,
                      value: f.id.toString(),
                    }))}
                    selected={selectedFaculties}
                    onChange={setSelectedFaculties}
                    placeholder={
                      selectedSubjects.length === 0
                        ? "Select subjects first..."
                        : "Select faculties..."
                    }
                  />
                  {selectedSubjects.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Select subjects to see available faculties
                    </p>
                  )}
                </div>

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

              {/* Batch faculty warning */}
              {batchFacultyWarning && (
                <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">
                      Some batch faculties are not mapped to the selected
                      subjects
                    </p>
                    <ul className="space-y-1">
                      {batchFacultyWarning.map((w) => (
                        <li key={w.batchName}>
                          <span className="font-medium">{w.batchName}</span>:{" "}
                          {w.facultyNames.join(", ")}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-amber-600">
                      These faculties won&apos;t appear in the faculty dropdown
                      unless their subjects are selected.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-rose-500" />
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
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />{" "}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Course Thumbnail
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="course-image-upload"
                    />
                    {courseImage ? (
                      <div className="relative border-2 border-slate-300 rounded-lg overflow-hidden bg-white/30">
                        <div className="relative h-40 w-full">
                          <Image
                            src={courseImage}
                            alt="Course thumbnail preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white/30 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mx-auto h-12 w-12 text-indigo-500 animate-spin" />
                            <p className="text-sm text-slate-600 mt-2">
                              Uploading...
                            </p>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    )}
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
