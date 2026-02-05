"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  Lock,
  FileText,
  Play,
  BookOpen,
  Trash2,
} from "lucide-react";
import React from "react";
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

function getTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Play className="h-4 w-4" />;
    case "quiz":
      return <FileText className="h-4 w-4" />;
    case "assignment":
      return <BookOpen className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "video":
      return "text-blue-600";
    case "quiz":
      return "text-green-600";
    case "assignment":
      return "text-purple-600";
    default:
      return "text-slate-600";
  }
}

export default function ContentsTab({
  lessons,
  courseId,
}: {
  lessons: Lesson[];
  courseId: string | number;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = React.useState<number | null>(
    null
  );
  const contents = useSelector((s: RootState) =>
    selectedTopicId ? selectCourseContentsByTopic(s, selectedTopicId) : []
  );
  const loadingContents = useSelector((s: RootState) =>
    selectedTopicId ? selectTopicContentsLoading(s, selectedTopicId) : false
  );
  // Use subjects/topics from the selected course in the courses store
  const selectedCourse = useSelector(
    (s: RootState) => s.coursesReducer.selected as Course | null
  );
  const courseLoading = useSelector(
    (s: RootState) => s.coursesReducer.loading
  );
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
    const map: Record<number, { topics: Array<{ id: number; name: string }> }> = {};
    for (const s of selectedCourse.subjects) {
      map[s.id] = {
        topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
      };
    }
    return map;
  }, [selectedCourse, courseId]);
  const allSubjects = useSelector(
    (s: RootState) => s.subjectsReducer.subjects
  ) as Array<{ id: number; name: string }>;
  const subjectsHasFetched = useSelector(
    (s: RootState) => s.subjectsReducer.hasFetched
  );
  const [subjectId, setSubjectId] = React.useState<number | "">("");
  const [topicId, setTopicId] = React.useState<number | "">("");
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
    typeof subjectId === "number" && subjectId > 0
      ? selectTopicsBySubject(s, subjectId)
      : []
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
      // Fetch contents for this topic
      await dispatch(
        fetchCourseContentsByTopic({
          courseId: Number(courseId),
          topicId: topId,
        })
      );
    },
    [dispatch, courseId]
  );

  const handleDeleteSubject = async (sid: number) => {
    const ok = window.confirm(
      "Remove this subject and delete ALL its course contents? The subject will remain in the system but be removed from this course."
    );
    if (!ok) return;
    try {
      await dispatch(
        deleteContentsBySubject({ courseId: Number(courseId), subjectId: sid })
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
    const ok = window.confirm(
      "Delete this media from the course-content? This cannot be undone."
    );
    if (!ok) return;
    try {
      await dispatch(deleteCourseContent(contentId)).unwrap();
      // Re-fetch the current topic's contents
      if (selectedTopicId) {
        await dispatch(
          fetchCourseContentsByTopic({
            courseId: Number(courseId),
            topicId: selectedTopicId,
          })
        );
      }
    } catch (e) {
      // no-op; global error middleware will surface
    }
  };

  const handleDeleteTopic = async (tid: number) => {
    const ok = window.confirm(
      "Remove this topic and delete ALL its course contents? The topic will remain in the system but be removed from this course."
    );
    if (!ok) return;
    try {
      await dispatch(
        deleteContentsByTopic({ courseId: Number(courseId), topicId: tid })
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
        })
      ).unwrap();

      setOpenSubjectDialog(false);
      setNewSubject({ name: "", code: "" });

      if (created?.id) {
        setSubjectId(created.id);
        await dispatch(fetchTopicsBySubject(created.id));
      }
    } catch (e) {
      // rely on global error handling from slice
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!subjectId || !newTopic.name.trim()) return;
    try {
      setCreatingTopic(true);
      await axiosInstance.post("/topics", {
        name: newTopic.name.trim(),
        description: newTopic.description.trim() || null,
        subject_id: Number(subjectId),
      });

      setOpenTopicDialog(false);
      setNewTopic({ name: "", description: "" });

      if (typeof subjectId === "number") {
        await dispatch(fetchTopicsBySubject(subjectId));
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

    if (!subjectId || !topicId) {
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
        await dispatch(
          addFileContent({
            courseId: Number(courseId),
            title,
            description,
            subjectId: Number(subjectId),
            topicId: Number(topicId),
            file: file as File,
          })
        ).unwrap();
      } else if (hasYouTube) {
        await dispatch(
          addYouTubeContent({
            courseId: Number(courseId),
            title,
            description,
            youtubeLink: yt,
            subjectId: Number(subjectId),
            topicId: Number(topicId),
          })
        ).unwrap();
      }
      form.reset();
      setFile(null);
      setShowForm(false);
      setSubjectId("");
      setTopicId("");
      // Refresh the current topic's contents if it matches
      if (selectedTopicId) {
        await dispatch(
          fetchCourseContentsByTopic({
            courseId: Number(courseId),
            topicId: selectedTopicId,
          })
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
    try {
      if (c.youtube_link) {
        window.open(c.youtube_link, "_blank");
        return;
      }
      if (!c.file_url) return;
      // Extract object name from file_url; our util stored full URL http://localhost:9000/bucket/object
      // Fallback to using the last segment as object key
      const parts = String(c.file_url).split("/");
      const objectName = decodeURIComponent(parts[parts.length - 1]);
      const resp = await fetch(
        `http://127.0.0.1:8000/course-contents/download-url?file_name=${encodeURIComponent(
          objectName
        )}`
      );
      if (!resp.ok) return;
      const { download_url } = await resp.json();
      window.open(download_url, "_blank");
    } catch (e) {
      // silently ignore
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
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Course Content</h3>
            {selectedTopicId && (
              <div className="text-sm text-slate-600">
                Showing contents for topic{" "}
                {topicNamesMap[Number(selectedTopicId)]?.name ||
                  `#${selectedTopicId}`}
              </div>
            )}
          </div>
          {!selectedTopicId ? (
            <div className="text-sm text-slate-600">
              Select a topic to view its contents.
            </div>
          ) : (
            <div className="space-y-2">
              {loadingContents && (
                <div className="text-sm text-slate-600">
                  Loading contents...
                </div>
              )}
              {!loadingContents && contents.length === 0 && (
                <div className="text-sm text-slate-600">No content yet.</div>
              )}
              {!loadingContents &&
                contents.map((c) => {
                  const type = c.youtube_link
                    ? "video"
                    : c.file_type
                    ? c.file_type
                    : "file";
                  return (
                    <Card
                      key={c.id}
                      className={`bg-white/30 backdrop-blur-sm border border-white/30 hover:bg-white/40 transition-all duration-200 hover:scale-[1.02]`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg bg-white/50 ${getTypeColor(
                                type
                              )}`}
                            >
                              {getTypeIcon(type)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {c.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Badge variant="outline" className="text-xs">
                                  {c.youtube_link
                                    ? "youtube"
                                    : c.file_type || "file"}
                                </Badge>
                                {c.topic_id && (
                                  <span className="text-xs text-slate-500">
                                    Topic{" "}
                                    {topicNamesMap[c.topic_id]?.name ||
                                      `#${c.topic_id}`}{" "}
                                    {c.subject_id
                                      ? `• ${
                                          subjectNamesMap[c.subject_id] ||
                                          `Subject #${c.subject_id}`
                                        }`
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOpenContent(c)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              Open
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContent(c.id)}
                              className="px-2 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                              aria-label="Delete media"
                              title="Delete media"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                    accept="*/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    value={subjectId as any}
                    onChange={async (e) => {
                      const sid = e.target.value
                        ? Number(e.target.value)
                        : ("" as any);
                      setSubjectId(sid);
                      setTopicId("");
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
                      disabled={!subjectId}
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
                    value={topicId as any}
                    onChange={(e) =>
                      setTopicId(
                        e.target.value ? Number(e.target.value) : ("" as any)
                      )
                    }
                    className="border rounded-md px-2 py-2 w-full"
                    required
                    disabled={!subjectId}
                  >
                    <option value="">
                      {subjectId ? "Select topic" : "Select subject first"}
                    </option>
                    {formTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Subject Dialog */}
              <Dialog
                open={openSubjectDialog}
                onOpenChange={setOpenSubjectDialog}
              >
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
                            setNewSubject((s) => ({
                              ...s,
                              name: e.target.value,
                            }))
                          }
                          placeholder="e.g. Mathematics"
                          required
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
                            setNewSubject((s) => ({
                              ...s,
                              code: e.target.value,
                            }))
                          }
                          placeholder="e.g. MATH101"
                          required
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
                      disabled={creatingSubject}
                      onClick={handleCreateSubject}
                    >
                      {creatingSubject ? "Creating..." : "Create Subject"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Topic Dialog */}
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
                          required
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
                            setNewTopic((t) => ({
                              ...t,
                              description: e.target.value,
                            }))
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
                      disabled={creatingTopic || !subjectId}
                      onClick={handleCreateTopic}
                    >
                      {creatingTopic ? "Creating..." : "Create Topic"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

      {/* Existing upload and content sections remain for adding new content */}
    </div>
  );
}
