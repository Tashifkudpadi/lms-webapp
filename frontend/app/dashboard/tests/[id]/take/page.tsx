"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Upload,
  Send,
  AlertTriangle,
  Award,
  XCircle,
  Eye,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchTestPreview,
  startTestAttempt,
  submitTestAttempt,
  TestCategory,
  TestQuestion,
} from "@/store/tests";
import { uploadToMinio } from "@/utils/uploadToMinio";

export default function TakeTestPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const testId = Number(params.id);
  const courseId = searchParams.get("courseId");
  const backUrl = courseId ? `/dashboard/courses/${courseId}` : "/dashboard/tests";

  const { preview: test, loading } = useSelector((state: RootState) => state.testsReducer);
  const user = useSelector((state: RootState) => state.authReducer.user);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number | null>>(new Map());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  // Shuffled questions
  const [shuffledQuestions, setShuffledQuestions] = useState<TestQuestion[]>([]);

  // Mains specific
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch test preview
  useEffect(() => {
    if (testId) {
      dispatch(fetchTestPreview(testId));
    }
  }, [dispatch, testId]);

  // Timer logic
  useEffect(() => {
    if (started && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          // Show warning at 5 minutes
          if (prev === 300) {
            setShowTimeWarning(true);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [started, timeLeft]);

  // Prevent page leave/reload while test is in progress
  useEffect(() => {
    if (!started || submitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Prevent browser back button
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [started, submitted]);

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartTest = async () => {
    // For students, we need the student_id from the students table
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to take the test", variant: "destructive" });
      return;
    }

    // Check if user is a student and has student_id
    const studentId = user.student_id;
    if (!studentId) {
      toast({ title: "Profile not linked", description: "Your account is not linked to a student profile. Please log out and log in again, or contact an administrator.", variant: "destructive" });
      return;
    }

    try {
      const result = await dispatch(
        startTestAttempt({ testId, studentId })
      ).unwrap();
      setAttemptId(result.id);
      setStarted(true);
      // Shuffle questions if enabled
      if (test?.shuffle_questions && test?.questions) {
        setShuffledQuestions(shuffleArray(test.questions));
      } else {
        setShuffledQuestions(test?.questions || []);
      }
      if (test?.duration_minutes) {
        setTimeLeft(test.duration_minutes * 60);
      }
    } catch (err: any) {
      console.error("Failed to start test:", err);
      // Extract backend error message from axios error response
      const backendMessage = err?.response?.data?.detail;
      const errorMessage = typeof backendMessage === "string"
        ? backendMessage
        : err?.message || "Failed to start test. Please try again.";
      toast({ title: "Failed to start test", description: errorMessage, variant: "destructive" });
    }
  };

  const handleSelectOption = (questionId: number, optionNumber: number) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, optionNumber);
      return newAnswers;
    });
  };

  const handleClearAnswer = (questionId: number) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.delete(questionId);
      return newAnswers;
    });
  };

  const handleAutoSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    await handleSubmitTest();
  }, [submitting, submitted]);

  const handleSubmitTest = async () => {
    if (!attemptId) return;
    setSubmitting(true);

    try {
      let answerFileUrl: string | undefined;
      let answerFileName: string | undefined;

      // Upload answer file first for mains tests
      if (test?.category === TestCategory.MAINS && answerFile) {
        setUploading(true);
        const { fileUrl } = await uploadToMinio(answerFile);
        answerFileUrl = fileUrl;
        answerFileName = answerFile.name;
        setUploading(false);
      }

      // Submit test with answers (use shuffledQuestions to include all questions)
      const questionsToSubmit = shuffledQuestions.length > 0 ? shuffledQuestions : test?.questions || [];
      const answersArray = questionsToSubmit.map((q) => ({
        question_id: q.id,
        selected_option: answers.get(q.id) || null,
      }));

      const result = await dispatch(
        submitTestAttempt({
          testId,
          attemptId,
          data: {
            answers: answersArray,
            answer_file_url: answerFileUrl,
            answer_file_name: answerFileName,
          },
        })
      ).unwrap();

      setSubmitResult(result);
      setSubmitted(true);
      setShowSubmitDialog(false);
    } catch (err) {
      console.error("Failed to submit test:", err);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => answers.size;
  const getTotalQuestions = () => shuffledQuestions.length || test?.questions?.length || 0;

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

  if (submitted) {
    const isPrelims = test.category === TestCategory.PRELIMS;
    const isEvaluated = submitResult?.status === "EVALUATED";
    const score = submitResult?.score ?? 0;
    const percentage = submitResult?.percentage ?? 0;
    const isPassed = isEvaluated && score >= (test.passing_marks || 0);
    const totalQ = submitResult?.total_questions ?? getTotalQuestions();
    const attemptedQ = submitResult?.attempted_questions ?? getAnsweredCount();
    const correctQ = submitResult?.correct_answers ?? 0;
    const wrongQ = submitResult?.wrong_answers ?? 0;

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-lg w-full space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Test Submitted!</h2>
              <p className="text-muted-foreground">
                Your test has been submitted successfully.
              </p>
            </CardContent>
          </Card>

          {isPrelims && isEvaluated && (
            <Card className={isPassed ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Award className={`w-6 h-6 ${isPassed ? "text-green-600" : "text-red-600"}`} />
                  {isPassed ? "Congratulations! You Passed!" : "You Did Not Pass"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    <span className={isPassed ? "text-green-700" : "text-red-700"}>
                      {score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/{test.total_marks}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% | Passing: {test.passing_marks}
                  </p>
                  <Badge className={`mt-2 ${isPassed ? "bg-green-500" : "bg-red-500"}`}>
                    {isPassed ? "PASS" : "FAIL"}
                  </Badge>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{totalQ}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-600">{attemptedQ}</p>
                    <p className="text-xs text-muted-foreground">Attempted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{correctQ}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-600">{wrongQ}</p>
                    <p className="text-xs text-muted-foreground">Wrong</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isPrelims && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Your answer has been uploaded. It will be evaluated by the faculty.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            {isPrelims && isEvaluated && attemptId && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/dashboard/tests/${testId}/attempts/${attemptId}${courseId ? `?courseId=${courseId}` : ""}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Detailed Review
              </Button>
            )}
            <Button
              className={`${isPrelims && isEvaluated && attemptId ? "flex-1" : "w-full"} bg-gradient-to-r from-blue-600 to-purple-600`}
              onClick={() => router.push(backUrl)}
            >
              Back to Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPrelims = test.category === TestCategory.PRELIMS;
  const isMains = test.category === TestCategory.MAINS;

  // Check if test is within its activation window
  const now = new Date();
  const testNotStartedYet = test.start_datetime ? now < new Date(test.start_datetime) : false;
  const testExpired = test.end_datetime ? now > new Date(test.end_datetime) : false;
  const testUnavailable = testNotStartedYet || testExpired;

  // Instructions screen before starting
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{test.test_name}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge>{test.exam_type}</Badge>
                <Badge variant="outline">{test.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {test.duration_minutes ? `${test.duration_minutes} minutes` : "No limit"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Marks</p>
                  <p className="font-medium">{test.total_marks}</p>
                </div>
                {isPrelims && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Questions</p>
                      <p className="font-medium">{test.questions?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Negative Marking</p>
                      <p className="font-medium">{test.negative_marking || 0} per wrong answer</p>
                    </div>
                  </>
                )}
              </div>

              {test.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="whitespace-pre-wrap text-sm">{test.instructions}</p>
                    </div>
                  </div>
                </div>
              )}

              {testNotStartedYet && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold">Test has not started yet</p>
                    <p>Starts at: {new Date(test.start_datetime!).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {testExpired && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Test has expired</p>
                    <p>The deadline was: {new Date(test.end_datetime!).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {!testUnavailable && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    {isPrelims
                      ? "Once you start the test, the timer will begin. Make sure you have a stable internet connection."
                      : "Download the question paper, solve the questions offline, and upload your answer sheet before the time ends."}
                  </p>
                </div>
              )}

              <Button
                onClick={handleStartTest}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={testUnavailable}
              >
                {testNotStartedYet ? "Test Not Started Yet" : testExpired ? "Test Expired" : "Start Test"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mains test interface
  if (isMains) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        {/* Header with timer */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{test.test_name}</h1>
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  timeLeft <= 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Mains Examination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Paper Download */}
              <div className="p-6 bg-slate-50 rounded-lg text-center">
                <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="font-medium mb-2">Question Paper</h3>
                {test.question_file_url ? (
                  <Button variant="outline" asChild>
                    <a href={test.question_file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download Question Paper
                    </a>
                  </Button>
                ) : (
                  <p className="text-muted-foreground">Question paper not available</p>
                )}
              </div>

              {/* Answer Upload */}
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="answer-file"
                />
                <label
                  htmlFor="answer-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <h3 className="font-medium">Upload Answer Sheet</h3>
                  <p className="text-sm text-muted-foreground">
                    Click to select your answer file (PDF, DOC, DOCX)
                  </p>
                  {answerFile && (
                    <Badge variant="secondary" className="mt-2">
                      {answerFile.name}
                    </Badge>
                  )}
                </label>
              </div>

              <Button
                onClick={() => setShowSubmitDialog(true)}
                size="lg"
                className="w-full"
                disabled={!answerFile}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Answer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Test?</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit your answer? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTest} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Prelims test interface (MCQ) - use shuffled questions
  const displayQuestions = shuffledQuestions.length > 0 ? shuffledQuestions : test.questions || [];
  const currentQ = displayQuestions[currentQuestion];
  const progressPercent = getTotalQuestions() > 0 ? (getAnsweredCount() / getTotalQuestions()) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Pulse animation for active circle */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .active-pulse {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 truncate">{test.test_name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-semibold ${
                  timeLeft <= 300
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : timeLeft <= 600
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit Test
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex pt-[68px] min-h-screen">
        {/* Left: Question Area */}
        <div className="flex-1 pr-80">
          <div className="max-w-3xl mx-auto p-6">
            {currentQ && (
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                      <span className="text-xs font-medium text-slate-500">Question</span>
                      <span className="text-sm font-bold text-slate-900">{currentQuestion + 1}</span>
                      <span className="text-xs text-slate-400">of {displayQuestions.length}</span>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {currentQ.marks} {currentQ.marks === 1 ? "mark" : "marks"}
                    </Badge>
                  </div>
                  {answers.has(currentQ.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearAnswer(currentQ.id)}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Question Card */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-6 space-y-6">
                    {/* Question Text */}
                    <div className="space-y-4">
                      <p className="text-base leading-relaxed text-slate-800">{currentQ.question_text}</p>
                      {currentQ.question_image_url && (
                        <img
                          src={currentQ.question_image_url}
                          alt="Question"
                          className="max-w-full rounded-lg border border-slate-200"
                        />
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQ.options.map((opt) => {
                        const isSelected = answers.get(currentQ.id) === opt.option_number;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(currentQ.id, opt.option_number)}
                            className={`w-full group relative rounded-xl border-2 text-left transition-all duration-200 ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-4 p-4">
                              <span
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-200 ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                }`}
                              >
                                {String.fromCharCode(64 + opt.option_number)}
                              </span>
                              <span className={`text-sm leading-relaxed ${isSelected ? "text-blue-900 font-medium" : "text-slate-700"}`}>
                                {opt.option_text}
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-blue-600 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-xs text-slate-400">
                    Use keyboard arrows or click question numbers
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(displayQuestions.length - 1, prev + 1)
                      )
                    }
                    disabled={currentQuestion === displayQuestions.length - 1}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Question Navigator Panel */}
        <div className="fixed right-0 top-[68px] bottom-0 w-80 bg-white border-l border-slate-200 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Question Navigator</h3>
            {/* Stats Row */}
            <div className="flex gap-2">
              <div className="flex-1 text-center py-2 rounded-lg bg-green-50 border border-green-100">
                <p className="text-lg font-bold text-green-700">{getAnsweredCount()}</p>
                <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider">Answered</p>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-lg font-bold text-slate-600">{getTotalQuestions() - getAnsweredCount()}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Remaining</p>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-lg font-bold text-blue-700">{getTotalQuestions()}</p>
                <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>

          {/* Question Circles */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2.5">
              {displayQuestions.map((q, idx) => {
                const isCurrent = currentQuestion === idx;
                const isAnswered = answers.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`relative w-11 h-11 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isCurrent
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 active-pulse focus:ring-blue-400"
                        : isAnswered
                        ? "bg-green-500 text-white shadow-sm hover:bg-green-600 hover:shadow-md focus:ring-green-400"
                        : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm focus:ring-slate-400"
                    }`}
                    title={`Question ${idx + 1}${isAnswered ? " (Answered)" : ""}`}
                  >
                    {idx + 1}
                    {isAnswered && !isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-200"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Warning Dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              5 Minutes Remaining
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            You have only 5 minutes left to complete the test. Please review your answers and submit.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xl font-bold text-blue-700">{getTotalQuestions()}</p>
                <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Total</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xl font-bold text-green-700">{getAnsweredCount()}</p>
                <p className="text-[10px] font-medium text-green-500 uppercase tracking-wider">Answered</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xl font-bold text-slate-600">{getTotalQuestions() - getAnsweredCount()}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Skipped</p>
              </div>
            </div>

            {timeLeft !== null && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Time remaining: <span className="font-semibold">{formatTime(timeLeft)}</span></span>
              </div>
            )}

            {getAnsweredCount() < getTotalQuestions() && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  You have <span className="font-semibold">{getTotalQuestions() - getAnsweredCount()}</span> unanswered
                  {getTotalQuestions() - getAnsweredCount() === 1 ? " question" : " questions"}.
                  Are you sure you want to submit?
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-slate-200">
              Review Answers
            </Button>
            <Button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {submitting ? "Submitting..." : "Confirm Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
