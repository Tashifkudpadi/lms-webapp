"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Play,
  BookOpen,
  Trash2,
  Download,
  Eye,
  Sheet,
  Pencil,
  Film,
  Youtube,
  Image as ImageIcon,
} from "lucide-react";
import React from "react";
import { useConfirm } from "@/components/confirm-dialog-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  addFileContent,
  addYouTubeContent,
  deleteContentsBySubject,
  deleteContentsByTopic,
  deleteCourseContent,
  fetchCourseContentsByTopic,
  selectCourseContentsByTopic,
  selectTopicContentsLoading,
  fetchCourseContents,
} from "@/store/courseContents";
import { fetchCourseById, Course } from "@/store/courses";
import { uploadToMinio } from "@/utils/uploadToMinio";
import { fetchSubjects, addSubject } from "@/store/subjects";
import { fetchTopicsBySubject, selectTopicsBySubject } from "@/store/topics";
// Removed dialog imports; creation handled elsewhere if needed
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosInstance from "@/utils/axios";

export type Lesson = {
  id: number | string;
  title: string;
  duration: string;
  type: "video" | "quiz" | "assignment" | string;
  completed: boolean;
  locked: boolean;
};

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getYouTubeThumbnailUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

const CONTENT_TYPE_CONFIG: Record<string, {
  label: string;
  pluralLabel: string;
  icon: React.ElementType;
  iconColorClass: string;
  bgColorClass: string;
  badgeColorClass: string;
}> = {
  video: {
    label: "Video",
    pluralLabel: "Videos",
    icon: Film,
    iconColorClass: "text-blue-600",
    bgColorClass: "bg-blue-50",
    badgeColorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  youtube: {
    label: "YouTube",
    pluralLabel: "YouTube Videos",
    icon: Youtube,
    iconColorClass: "text-red-500",
    bgColorClass: "bg-red-50",
    badgeColorClass: "bg-red-100 text-red-600 border-red-200",
  },
  image: {
    label: "Image",
    pluralLabel: "Images",
    icon: ImageIcon,
    iconColorClass: "text-pink-600",
    bgColorClass: "bg-pink-50",
    badgeColorClass: "bg-pink-100 text-pink-700 border-pink-200",
  },
  pdf: {
    label: "PDF",
    pluralLabel: "PDFs",
    icon: FileText,
    iconColorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    badgeColorClass: "bg-red-100 text-red-700 border-red-200",
  },
  excel: {
    label: "Spreadsheet",
    pluralLabel: "Spreadsheets",
    icon: Sheet,
    iconColorClass: "text-green-600",
    bgColorClass: "bg-green-50",
    badgeColorClass: "bg-green-100 text-green-700 border-green-200",
  },
  file: {
    label: "File",
    pluralLabel: "Files",
    icon: FileText,
    iconColorClass: "text-slate-600",
    bgColorClass: "bg-slate-50",
    badgeColorClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const SECTION_ORDER = ["video", "youtube", "image", "pdf", "excel", "file"];

function getContentCategory(
  c: any,
): "image" | "video" | "pdf" | "excel" | "youtube" | "file" {
  if (c.youtube_link) return "youtube";
  const ft = (c.file_type || "").toLowerCase();
  const url = (c.file_url || "").toLowerCase();
  if (ft.startsWith("image/") || /\.(png|jpe?g)$/i.test(url)) return "image";
  if (ft.startsWith("video/") || /\.mp4$/i.test(url)) return "video";
  if (ft === "application/pdf" || /\.pdf$/i.test(url)) return "pdf";
  if (
    ft.includes("spreadsheet") ||
    ft.includes("excel") ||
    /\.xlsx?$/i.test(url)
  )
    return "excel";
  return "file";
}

const ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg,.mp4,.pdf,.xlsx,.xls";

export default function ContentsTab({
  lessons,
  courseId,
}: {
  lessons: Lesson[];
  courseId: string | number;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [previewContent, setPreviewContent] = React.useState<any>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [editContent, setEditContent] = React.useState<any>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editFile, setEditFile] = React.useState<File | null>(null);
  const [editFileName, setEditFileName] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);
  const [selectedTopicId, setSelectedTopicId] = React.useState<number | null>(
    null,
  );
  const contents = useSelector((s: RootState) =>
    selectedTopicId ? selectCourseContentsByTopic(s, selectedTopicId) : [],
  );
  const loadingContents = useSelector((s: RootState) =>
    selectedTopicId ? selectTopicContentsLoading(s, selectedTopicId) : false,
  );

  const groupedContents = React.useMemo(() => {
    const groups: Record<string, typeof contents> = {};
    for (const c of contents) {
      const cat = getContentCategory(c);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    return groups;
  }, [contents]);
  // Use subjects/topics from the selected course in the courses store
  const selectedCourse = useSelector(
    (s: RootState) => s.coursesReducer.selected as Course | null,
  );
  const courseLoading = useSelector((s: RootState) => s.coursesReducer.loading);
  // Build subjects array and topicsMap from the selected course
  // Only use data if the selected course matches the current courseId to prevent stale data
  const subjects = React.useMemo(() => {
    if (!selectedCourse?.subjects) return [];
    if (selectedCourse.id !== Number(courseId)) return [];
    return selectedCourse.subjects.map((s) => ({ id: s.id, name: s.name }));
  }, [selectedCourse, courseId]);
  const topicsMap = React.useMemo(() => {
    if (!selectedCourse?.subjects) return {};
    if (selectedCourse.id !== Number(courseId)) return {};
    const map: Record<number, { topics: Array<{ id: number; name: string }> }> =
      {};
    for (const s of selectedCourse.subjects) {
      map[s.id] = {
        topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
      };
    }
    return map;
  }, [selectedCourse, courseId]);
  const allSubjects = useSelector(
    (s: RootState) => s.subjectsReducer.subjects,
  ) as Array<{ id: number; name: string }>;
  const subjectsHasFetched = useSelector(
    (s: RootState) => s.subjectsReducer.hasFetched,
  );
  const [subjectId, setSubjectId] = React.useState<number | "">("");
  const [topicId, setTopicId] = React.useState<number | "">("");
  // Separate state for the "Add Content" form (not linked to sidebar browsing)
  const [formSubjectId, setFormSubjectId] = React.useState<number | "">("");
  const [formTopicId, setFormTopicId] = React.useState<number | "">("");
  const [openSubjectDialog, setOpenSubjectDialog] = React.useState(false);
  const [openTopicDialog, setOpenTopicDialog] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState({ name: "", code: "" });
  const [creatingSubject, setCreatingSubject] = React.useState(false);
  const [newTopic, setNewTopic] = React.useState({
    name: "",
    description: "",
  });
  const [creatingTopic, setCreatingTopic] = React.useState(false);
  // Build topic and subject name maps from the selected course
  const topicNamesMap = React.useMemo(() => {
    if (!selectedCourse?.subjects) return {};
    if (selectedCourse.id !== Number(courseId)) return {};
    const map: Record<number, { name: string; subject_id: number }> = {};
    for (const s of selectedCourse.subjects) {
      for (const t of s.topics) {
        map[t.id] = { name: t.name, subject_id: s.id };
      }
    }
    return map;
  }, [selectedCourse, courseId]);
  const subjectNamesMap = React.useMemo(() => {
    if (!selectedCourse?.subjects) return {};
    if (selectedCourse.id !== Number(courseId)) return {};
    const map: Record<number, string> = {};
    for (const s of selectedCourse.subjects) {
      map[s.id] = s.name;
    }
    return map;
  }, [selectedCourse, courseId]);
  const formTopics = useSelector((s: RootState) =>
    typeof formSubjectId === "number" && formSubjectId > 0
      ? selectTopicsBySubject(s, formSubjectId)
      : [],
  );
  // Removed subject/topic creation state (managed elsewhere)
  React.useEffect(() => {
    // Fetch the course which includes subjects and topics
    dispatch(fetchCourseById(Number(courseId)));
    // Only fetch all subjects if not already fetched (for the add content form)
    if (!subjectsHasFetched) {
      dispatch(fetchSubjects());
    }
  }, [dispatch, courseId, subjectsHasFetched]);

  const handleTopicClick = React.useCallback(
    async (subId: number, topId: number) => {
      setSubjectId(subId);
      setTopicId(topId);
      setSelectedTopicId(topId);
      // Note: subjectId/topicId track the browsed topic; form uses formSubjectId/formTopicId
      // Fetch contents for this topic
      await dispatch(
        fetchCourseContentsByTopic({
          courseId: Number(courseId),
          topicId: topId,
        }),
      );
    },
    [dispatch, courseId],
  );

  const handleDeleteSubject = async (sid: number) => {
    const ok = await confirm({ title: "Remove Subject", description: "Remove this subject and delete ALL its course contents? The subject will remain in the system but be removed from this course.", confirmLabel: "Remove", variant: "destructive" });
    if (!ok) return;
    try {
      await dispatch(
        deleteContentsBySubject({ courseId: Number(courseId), subjectId: sid }),
      ).unwrap();
      if (subjectId === sid) {
        setSubjectId("");
        setTopicId("");
        setSelectedTopicId(null);
      }
      // Refresh the course to update subjects/topics
      await dispatch(fetchCourseById(Number(courseId)));
    } catch (e) {
      // no-op; global error middleware will surface
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    const ok = await confirm({ title: "Delete Content", description: "Delete this media from the course-content? This cannot be undone.", confirmLabel: "Delete", variant: "destructive" });
    if (!ok) return;
    try {
      await dispatch(deleteCourseContent(contentId)).unwrap();
      // Re-fetch the current topic's contents
      if (selectedTopicId) {
        await dispatch(
          fetchCourseContentsByTopic({
            courseId: Number(courseId),
            topicId: selectedTopicId,
          }),
        );
      }
    } catch (e) {
      // no-op; global error middleware will surface
    }
  };

  const handleDeleteTopic = async (tid: number) => {
    const ok = await confirm({ title: "Remove Topic", description: "Remove this topic and delete ALL its course contents? The topic will remain in the system but be removed from this course.", confirmLabel: "Remove", variant: "destructive" });
    if (!ok) return;
    try {
      await dispatch(
        deleteContentsByTopic({ courseId: Number(courseId), topicId: tid }),
      ).unwrap();
      if (topicId === tid) {
        setTopicId("");
        setSelectedTopicId(null);
      }
      // Refresh the course to update subjects/topics
      await dispatch(fetchCourseById(Number(courseId)));
    } catch (e) {
      // no-op; global error middleware will surface
    }
  };
  // Removed legacy local topic fetching; using topics slice for form topics

  const handleCreateSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) return;
    try {
      setCreatingSubject(true);
      const created: any = await dispatch(
        addSubject({
          name: newSubject.name.trim(),
          code: newSubject.code.trim(),
          faculty_ids: [],
        }),
      ).unwrap();

      // Ensure subjects list is refreshed before auto-selecting
      await dispatch(fetchSubjects());

      setOpenSubjectDialog(false);
      setNewSubject({ name: "", code: "" });

      if (created?.id) {
        setFormSubjectId(created.id);
        setFormTopicId("");
        await dispatch(fetchTopicsBySubject(created.id));
      }
    } catch (e) {
      // rely on global error handling from slice
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!formSubjectId || !newTopic.name.trim()) return;
    try {
      setCreatingTopic(true);
      const resp = await axiosInstance.post("/topics", {
        name: newTopic.name.trim(),
        description: newTopic.description.trim() || null,
        subject_id: Number(formSubjectId),
      });

      setOpenTopicDialog(false);
      setNewTopic({ name: "", description: "" });

      if (typeof formSubjectId === "number") {
        await dispatch(fetchTopicsBySubject(formSubjectId));
      }

      // Auto-select the newly created topic
      if (resp.data?.id) {
        setFormTopicId(resp.data.id);
      }
    } catch (e) {
      // rely on backend/global error handling
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as any;
    setError("");

    const title = form.title.value;
    const description = form.description.value || "";
    const yt = (form.youtube?.value || form.youtube_link?.value || "").trim();

    if (!formSubjectId || !formTopicId) {
      setError("Please select a subject and a topic.");
      return;
    }

    // Decide endpoint: file upload vs YouTube-only
    const hasFile = !!file;
    const hasYouTube = !!yt;
    if (!hasFile && !hasYouTube) {
      setError("Please provide either a file or a YouTube link.");
      return;
    }

    try {
      setUploading(true);
      if (hasFile) {
        // Use custom file name if provided
        let uploadFile = file as File;
        if (fileName && fileName !== file!.name) {
          const ext = file!.name.split(".").pop();
          const customName = fileName.includes(".")
            ? fileName
            : `${fileName}.${ext}`;
          uploadFile = new File([file!], customName, { type: file!.type });
        }
        await dispatch(
          addFileContent({
            courseId: Number(courseId),
            title,
            description,
            subjectId: Number(formSubjectId),
            topicId: Number(formTopicId),
            file: uploadFile,
          }),
        ).unwrap();
      } else if (hasYouTube) {
        await dispatch(
          addYouTubeContent({
            courseId: Number(courseId),
            title,
            description,
            youtubeLink: yt,
            subjectId: Number(formSubjectId),
            topicId: Number(formTopicId),
          }),
        ).unwrap();
      }
      form.reset();
      setFile(null);
      setFileName("");
      setShowForm(false);
      setFormSubjectId("");
      setFormTopicId("");
      // Refresh the current topic's contents if it matches
      if (selectedTopicId) {
        await dispatch(
          fetchCourseContentsByTopic({
            courseId: Number(courseId),
            topicId: selectedTopicId,
          }),
        );
      }
      // Also refresh the course to update subjects/topics
      await dispatch(fetchCourseById(Number(courseId)));
    } catch (err) {
      setError("Failed to add content. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenContent = async (c: any) => {
    setPreviewContent(c);
    if (c.youtube_link) {
      setPreviewUrl(c.youtube_link);
      return;
    }
    if (!c.file_url) return;
    // Use direct MinIO URL (bucket is public read)
    setPreviewUrl(c.file_url);
  };

  const handleClosePreview = () => {
    setPreviewContent(null);
    setPreviewUrl("");
  };

  const handleDownloadContent = async (c: any) => {
    try {
      if (!c.file_url) return;
      const parts = String(c.file_url).split("/");
      const objectName = decodeURIComponent(parts[parts.length - 1]);
      const resp = await fetch(
        `http://127.0.0.1:8000/course-contents/download-url?file_name=${encodeURIComponent(
          objectName,
        )}`,
      );
      if (!resp.ok) return;
      const { download_url } = await resp.json();
      const a = document.createElement("a");
      a.href = download_url;
      a.download = c.title || objectName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const handleEditContent = (c: any) => {
    setEditContent(c);
    setEditTitle(c.title || "");
    setEditFile(null);
    setEditFileName("");
  };

  const handleSaveEdit = async () => {
    if (!editContent) return;
    setEditSaving(true);
    try {
      let newFileUrl = editContent.file_url;
      let newFileType = editContent.file_type;

      // Upload replacement file if selected
      if (editFile) {
        let uploadFile = editFile;
        if (editFileName && editFileName !== editFile.name) {
          const ext = editFile.name.split(".").pop();
          const customName = editFileName.includes(".")
            ? editFileName
            : `${editFileName}.${ext}`;
          uploadFile = new File([editFile], customName, {
            type: editFile.type,
          });
        }
        const { fileUrl } = await uploadToMinio(uploadFile);
        newFileUrl = fileUrl;
        newFileType = editFile.type;
      }

      await axiosInstance.put(`/course-contents/${editContent.id}`, {
        title: editTitle,
        file_url: newFileUrl,
        file_type: newFileType,
      });

      setEditContent(null);
      // Refresh contents
      if (selectedTopicId) {
        await dispatch(
          fetchCourseContentsByTopic({
            courseId: Number(courseId),
            topicId: selectedTopicId,
          }),
        );
      }
    } catch (e) {
      console.error("Failed to update content:", e);
      toast({ title: "Update failed", description: "Failed to update content. Please try again.", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subjects and Topics Browser */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <h4 className="font-semibold mb-3 text-slate-900">
            Browse by Subject
          </h4>
          {courseLoading && (
            <div className="text-sm text-slate-600">Loading subjects...</div>
          )}
          {!courseLoading && subjects.length === 0 && (
            <div className="text-sm text-slate-500">
              No subjects with content yet. Add content to see subjects here.
            </div>
          )}
          <div className="space-y-3">
            {subjects.map((s) => {
              const entry = topicsMap[s.id];
              const topics = entry?.topics || [];
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-blue-600/10 text-blue-700 flex items-center justify-center">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span
                        className="font-medium text-slate-900 truncate"
                        title={s.name}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {topics.length}{" "}
                        {topics.length === 1 ? "topic" : "topics"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(s.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 border border-transparent hover:border-red-100"
                        aria-label="Delete subject"
                        title="Delete subject"
                      >
                        <Trash2 className="h-4 w-4 text-indigo-500" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    {topics.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2 px-1">
                        No topics
                      </div>
                    ) : (
                      <ul className="flex flex-col">
                        {topics.map((t) => {
                          const active = selectedTopicId === t.id;
                          return (
                            <li key={t.id}>
                              <div
                                className={`w-full px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                                  active ? "bg-blue-50/80" : "hover:bg-slate-50"
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`text-left flex items-center gap-2 border border-transparent ${
                                    active ? "text-blue-800" : "text-slate-700"
                                  }`}
                                  onClick={() => handleTopicClick(s.id, t.id)}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      active ? "bg-blue-600" : "bg-slate-300"
                                    }`}
                                  />
                                  <span
                                    className="text-sm truncate"
                                    title={t.name}
                                  >
                                    {t.name}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTopic(t.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 border border-transparent hover:border-red-100"
                                  aria-label="Delete topic"
                                  title="Delete topic"
                                >
                                  <Trash2 className="h-4 w-4 text-violet-400" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Right Side: Grouped Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-slate-900">Course Content</h3>
            {selectedTopicId && (
              <p className="text-sm text-slate-500 mt-1">
                Showing contents for{" "}
                <span className="font-medium text-slate-700">
                  {topicNamesMap[Number(selectedTopicId)]?.name || `Topic #${selectedTopicId}`}
                </span>
                {" "}&middot;{" "}
                <span className="text-slate-600">{contents.length} item{contents.length !== 1 ? "s" : ""}</span>
              </p>
            )}
          </div>

          {/* States */}
          {!selectedTopicId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Select a topic to view its contents</p>
              <p className="text-sm text-slate-400 mt-1">Choose a subject and topic from the sidebar</p>
            </div>
          ) : loadingContents ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">Loading contents...</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No content yet</p>
              <p className="text-sm text-slate-400 mt-1">Add content using the button below</p>
            </div>
          ) : (
            <div className="space-y-8">
              {SECTION_ORDER.filter((cat) => groupedContents[cat]?.length > 0).map((cat) => {
                const config = CONTENT_TYPE_CONFIG[cat];
                const items = groupedContents[cat];
                const SectionIcon = config.icon;

                return (
                  <div key={cat}>
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${config.bgColorClass}`}>
                        <SectionIcon className={`h-5 w-5 ${config.iconColorClass}`} />
                      </div>
                      <h4 className="font-semibold text-slate-800">{config.pluralLabel}</h4>
                      <Badge variant="outline" className={`text-xs ${config.badgeColorClass}`}>
                        {items.length}
                      </Badge>
                    </div>

                    {/* IMAGE GRID */}
                    {cat === "image" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((c) => (
                          <div
                            key={c.id}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                          >
                            <div
                              className="aspect-square bg-slate-100 cursor-pointer"
                              onClick={() => handleOpenContent(c)}
                            >
                              <img
                                src={c.file_url || ""}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                              <p className="text-white text-sm font-medium truncate mb-2">{c.title}</p>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => handleOpenContent(c)} className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white transition-colors" title="View">
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleEditContent(c)} className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white transition-colors" title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDownloadContent(c)} className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white transition-colors" title="Download">
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteContent(c.id)} className="p-1.5 rounded-md bg-red-500/40 backdrop-blur-sm hover:bg-red-500/70 text-white transition-colors ml-auto" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-2.5">
                              <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* VIDEO CARDS */}
                    {cat === "video" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                          >
                            <div
                              className="relative aspect-video bg-slate-900 cursor-pointer group"
                              onClick={() => handleOpenContent(c)}
                            >
                              <video src={c.file_url || ""} className="w-full h-full object-cover" preload="metadata" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                <div className="h-14 w-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="h-6 w-6 text-blue-600 ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="p-3 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">MP4 Video</p>
                              </div>
                              <div className="flex items-center gap-1 ml-3 shrink-0">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditContent(c)} title="Edit"><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownloadContent(c)} title="Download"><Download className="h-4 w-4 text-slate-500" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-red-600" onClick={() => handleDeleteContent(c.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* YOUTUBE CARDS */}
                    {cat === "youtube" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((c) => {
                          const thumbUrl = getYouTubeThumbnailUrl(c.youtube_link || "");
                          return (
                            <div
                              key={c.id}
                              className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                            >
                              <div
                                className="relative aspect-video bg-slate-100 cursor-pointer group"
                                onClick={() => handleOpenContent(c)}
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-red-50">
                                    <Youtube className="h-12 w-12 text-red-400" />
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                  <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="h-6 w-6 text-white ml-0.5" />
                                  </div>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-red-600 text-white border-0 text-[10px] px-1.5 py-0.5">YouTube</Badge>
                                </div>
                              </div>
                              <div className="p-3 flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.youtube_link}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-3 shrink-0">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenContent(c)} title="View"><Eye className="h-4 w-4 text-slate-500" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditContent(c)} title="Edit"><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-red-600" onClick={() => handleDeleteContent(c.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* FILE CARDS (PDF, Excel, generic) */}
                    {(cat === "pdf" || cat === "excel" || cat === "file") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((c) => {
                          const ItemIcon = config.icon;
                          return (
                            <div
                              key={c.id}
                              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-200 group"
                            >
                              <div
                                className={`shrink-0 h-12 w-12 rounded-lg ${config.bgColorClass} flex items-center justify-center cursor-pointer`}
                                onClick={() => handleOpenContent(c)}
                              >
                                <ItemIcon className={`h-6 w-6 ${config.iconColorClass}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-semibold text-slate-900 truncate cursor-pointer hover:text-blue-700 transition-colors"
                                  onClick={() => handleOpenContent(c)}
                                >
                                  {c.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className={`text-[10px] ${config.badgeColorClass}`}>
                                    {config.label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenContent(c)} title="View"><Eye className="h-4 w-4 text-slate-500" /></Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditContent(c)} title="Edit"><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                {c.file_url && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownloadContent(c)} title="Download"><Download className="h-4 w-4 text-slate-500" /></Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-red-600" onClick={() => handleDeleteContent(c.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Add Content Toggle */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {showForm ? "Close" : "Add Content"}
        </Button>
      </div>

      {/* Upload Content Form (collapsible) */}
      <div
        className={`transition-all duration-300 ease-out transform origin-top ${
          showForm
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 h-0 overflow-hidden"
        }`}
      >
        <Card className="bg-white/80 backdrop-blur-xl border border-blue-200 shadow-2xl">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      setFileName(f ? f.name : "");
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Allowed: PNG, JPG, MP4, PDF, Excel
                  </p>
                  {file && (
                    <div className="space-y-1">
                      <Label htmlFor="fileName" className="text-xs">
                        File Name (editable)
                      </Label>
                      <Input
                        id="fileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name..."
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    value={formSubjectId as any}
                    onChange={async (e) => {
                      const sid = e.target.value
                        ? Number(e.target.value)
                        : ("" as any);
                      setFormSubjectId(sid);
                      setFormTopicId("");
                      if (sid) {
                        await dispatch(fetchTopicsBySubject(sid));
                      }
                    }}
                    className="border rounded-md px-2 py-2 w-full"
                    required
                  >
                    <option value="">Select subject</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <button
                      type="button"
                      className="underline hover:text-slate-900"
                      onClick={() => setOpenSubjectDialog(true)}
                    >
                      + New subject
                    </button>
                    <span className="text-slate-400">|</span>
                    <button
                      type="button"
                      className="underline hover:text-slate-900"
                      disabled={!formSubjectId}
                      onClick={() => setOpenTopicDialog(true)}
                    >
                      + New topic for subject
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <select
                    id="topic"
                    value={formTopicId as any}
                    onChange={(e) =>
                      setFormTopicId(
                        e.target.value ? Number(e.target.value) : ("" as any),
                      )
                    }
                    className="border rounded-md px-2 py-2 w-full"
                    required
                    disabled={!formSubjectId}
                  >
                    <option value="">
                      {formSubjectId ? "Select topic" : "Select subject first"}
                    </option>
                    {formTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Optional short description..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube Link</Label>
                <Input id="youtube" name="youtube" placeholder="YouTube link" />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {uploading ? "Uploading..." : "Add Content"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Create Subject Dialog (outside form to prevent form interference) */}
      <Dialog open={openSubjectDialog} onOpenChange={setOpenSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dlg-subject-name" className="text-xs">
                  Name
                </Label>
                <Input
                  id="dlg-subject-name"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="dlg-subject-code" className="text-xs">
                  Code
                </Label>
                <Input
                  id="dlg-subject-code"
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject((s) => ({ ...s, code: e.target.value }))
                  }
                  placeholder="e.g. MATH101"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpenSubjectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                creatingSubject ||
                !newSubject.name.trim() ||
                !newSubject.code.trim()
              }
              onClick={handleCreateSubject}
            >
              {creatingSubject ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Topic Dialog (outside form) */}
      <Dialog open={openTopicDialog} onOpenChange={setOpenTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dlg-topic-name" className="text-xs">
                  Name
                </Label>
                <Input
                  id="dlg-topic-name"
                  value={newTopic.name}
                  onChange={(e) =>
                    setNewTopic((t) => ({ ...t, name: e.target.value }))
                  }
                  placeholder="e.g. Algebra"
                />
              </div>
              <div>
                <Label htmlFor="dlg-topic-desc" className="text-xs">
                  Description
                </Label>
                <Input
                  id="dlg-topic-desc"
                  value={newTopic.description}
                  onChange={(e) =>
                    setNewTopic((t) => ({ ...t, description: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpenTopicDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creatingTopic || !formSubjectId || !newTopic.name.trim()}
              onClick={handleCreateTopic}
            >
              {creatingTopic ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog
        open={!!editContent}
        onOpenChange={(open) => !open && setEditContent(null)}
      >
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 overflow-hidden">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full"
              />
            </div>
            {editContent?.file_url && (
              <div className="space-y-2 min-w-0">
                <Label>Current File</Label>
                <p className="text-sm text-slate-600 truncate max-w-full">
                  {decodeURIComponent(
                    String(editContent.file_url).split("/").pop() || "",
                  )}
                </p>
              </div>
            )}
            <div className="space-y-2 min-w-0">
              <Label htmlFor="edit-file">Replace File (optional)</Label>
              <Input
                id="edit-file"
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="w-full file:mr-2 file:text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setEditFile(f);
                  setEditFileName(f ? f.name : "");
                }}
              />
              <p className="text-xs text-slate-500">
                Allowed: PNG, JPG, MP4, PDF, Excel
              </p>
              {editFile && (
                <div className="space-y-1">
                  <Label htmlFor="edit-fileName" className="text-xs">
                    File Name (editable)
                  </Label>
                  <Input
                    id="edit-fileName"
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    placeholder="Enter file name..."
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditContent(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={editSaving || !editTitle.trim()}
              onClick={handleSaveEdit}
            >
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Preview Dialog */}
      <Dialog
        open={!!previewContent}
        onOpenChange={(open) => !open && handleClosePreview()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{previewContent?.title || "Preview"}</span>
              {previewContent?.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadContent(previewContent)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {previewContent &&
              (() => {
                const category = getContentCategory(previewContent);
                switch (category) {
                  case "youtube": {
                    const embedUrl = getYouTubeEmbedUrl(previewUrl);
                    return embedUrl ? (
                      <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={previewContent.title}
                        />
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        Unable to embed this YouTube video.
                      </p>
                    );
                  }
                  case "image":
                    return (
                      <div className="flex justify-center">
                        <img
                          src={previewUrl}
                          alt={previewContent.title}
                          className="max-w-full max-h-[70vh] rounded-lg object-contain"
                        />
                      </div>
                    );
                  case "video":
                    return (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  case "pdf":
                    return (
                      <div
                        className="w-full rounded-lg overflow-hidden"
                        style={{ height: "70vh" }}
                      >
                        <iframe
                          src={previewUrl}
                          className="w-full h-full"
                          title={previewContent.title}
                        />
                      </div>
                    );
                  case "excel":
                    return (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <Sheet className="h-16 w-16 text-green-600" />
                        <p className="text-lg font-medium">
                          {previewContent.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Excel files cannot be previewed. Please download to
                          view.
                        </p>
                        <Button
                          onClick={() => handleDownloadContent(previewContent)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    );
                  default:
                    return (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <FileText className="h-16 w-16 text-slate-400" />
                        <p className="text-lg font-medium">
                          {previewContent.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This file type cannot be previewed. Please download to
                          view.
                        </p>
                        {previewContent.file_url && (
                          <Button
                            onClick={() =>
                              handleDownloadContent(previewContent)
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        )}
                      </div>
                    );
                }
              })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
