"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const dispatch = useDispatch<AppDispatch>();
  const testId = Number(params.id);

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

      await dispatch(
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Test Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your test has been submitted successfully.
              {test.category === TestCategory.PRELIMS
                ? " Your results will be available shortly."
                : " Your answer will be evaluated by the faculty."}
            </p>
            <Button onClick={() => router.push("/dashboard/tests")}>
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPrelims = test.category === TestCategory.PRELIMS;
  const isMains = test.category === TestCategory.MAINS;

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

              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  {isPrelims
                    ? "Once you start the test, the timer will begin. Make sure you have a stable internet connection."
                    : "Download the question paper, solve the questions offline, and upload your answer sheet before the time ends."}
                </p>
              </div>

              <Button
                onClick={handleStartTest}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Start Test
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold truncate max-w-md">{test.test_name}</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Answered:</span>{" "}
              <span className="font-medium">
                {getAnsweredCount()}/{getTotalQuestions()}
              </span>
            </div>
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
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>
      </div>

      <div className="flex pt-20">
        {/* Question Navigator Sidebar */}
        <div className="fixed left-0 top-20 bottom-0 w-64 bg-white shadow-md p-4 overflow-y-auto">
          <h3 className="font-medium mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {displayQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                  currentQuestion === idx
                    ? "bg-blue-600 text-white border-blue-600"
                    : answers.has(q.id)
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {q.question_number}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {currentQ && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {currentQ.question_number}
                      </span>
                      <Badge variant="outline">{currentQ.marks} marks</Badge>
                    </div>
                    {answers.has(currentQ.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearAnswer(currentQ.id)}
                        className="text-red-600"
                      >
                        Clear Answer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg">{currentQ.question_text}</p>

                  {currentQ.question_image_url && (
                    <img
                      src={currentQ.question_image_url}
                      alt="Question"
                      className="max-w-full rounded-lg"
                    />
                  )}

                  <div className="space-y-3">
                    {currentQ.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.option_number)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          answers.get(currentQ.id) === opt.option_number
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              answers.get(currentQ.id) === opt.option_number
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100"
                            }`}
                          >
                            {String.fromCharCode(64 + opt.option_number)}
                          </span>
                          <span>{opt.option_text}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentQuestion((prev) =>
                          Math.min(displayQuestions.length - 1, prev + 1)
                        )
                      }
                      disabled={currentQuestion === displayQuestions.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Time Warning Dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              5 Minutes Remaining!
            </DialogTitle>
          </DialogHeader>
          <p>You have only 5 minutes left to complete the test. Please review your answers.</p>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Questions</p>
                  <p className="font-medium">{getTotalQuestions()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Answered</p>
                  <p className="font-medium">{getAnsweredCount()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Not Answered</p>
                  <p className="font-medium">{getTotalQuestions() - getAnsweredCount()}</p>
                </div>
                {timeLeft !== null && (
                  <div>
                    <p className="text-muted-foreground">Time Remaining</p>
                    <p className="font-medium">{formatTime(timeLeft)}</p>
                  </div>
                )}
              </div>
            </div>

            {getAnsweredCount() < getTotalQuestions() && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  You have {getTotalQuestions() - getAnsweredCount()} unanswered questions. Are you
                  sure you want to submit?
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Review Answers
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
