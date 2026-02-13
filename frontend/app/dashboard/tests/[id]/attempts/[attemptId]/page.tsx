"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Award,
  User,
  Calendar,
  BarChart3,
  Save,
} from "lucide-react";
import { RootState, AppDispatch } from "@/store";
import {
  fetchAttemptReview,
  fetchTestById,
  fetchQuestions,
  TestCategory,
  AttemptStatus,
} from "@/store/tests";
import axiosInstance from "@/utils/axios";

export default function AttemptReviewPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const testId = Number(params.id);
  const attemptId = Number(params.attemptId);

  const { attemptReview, selected: test, questions, loading } = useSelector(
    (state: RootState) => state.testsReducer
  );

  const [evaluationData, setEvaluationData] = useState({
    score: 0,
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (testId && attemptId) {
      dispatch(fetchAttemptReview({ testId, attemptId }));
      dispatch(fetchTestById(testId));
      dispatch(fetchQuestions(testId));
    }
  }, [dispatch, testId, attemptId]);

  const handleEvaluate = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/tests/${testId}/attempts/${attemptId}/evaluate?evaluator_id=1`,
        evaluationData
      );
      // Refresh attempt review
      dispatch(fetchAttemptReview({ testId, attemptId }));
      toast({ title: "Success", description: "Evaluation submitted successfully!" });
    } catch (error: any) {
      console.error("Failed to evaluate:", error);
      toast({ title: "Evaluation failed", description: error.response?.data?.detail || "Failed to submit evaluation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !attemptReview || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading attempt review...</p>
        </div>
      </div>
    );
  }

  const isPrelims = test.category === TestCategory.PRELIMS;
  const isMains = test.category === TestCategory.MAINS;
  const isEvaluated = attemptReview.status === AttemptStatus.EVALUATED;
  const isPassed =
    isEvaluated &&
    attemptReview.score !== null &&
    attemptReview.score !== undefined &&
    attemptReview.score >= (test.passing_marks || 0);

  // Create a map of answers by question_id
  const answersMap = new Map(
    attemptReview.answers.map((ans) => [ans.question_id, ans])
  );

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/tests/${testId}`)}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Test
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {attemptReview.test_name}
          </h1>
          <p className="text-muted-foreground">Attempt Review</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="text-lg font-bold">{attemptReview.student_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="text-sm font-medium">
                  {attemptReview.submitted_at
                    ? new Date(attemptReview.submitted_at).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
                <p className="text-lg font-bold">
                  {attemptReview.time_taken_seconds
                    ? `${Math.floor(attemptReview.time_taken_seconds / 60)} min`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${
            isPassed
              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              : isEvaluated
              ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
              : "bg-white"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award
                className={`w-8 h-8 ${
                  isPassed
                    ? "text-green-600"
                    : isEvaluated
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              />
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-bold">
                  {isEvaluated && attemptReview.score !== null
                    ? `${attemptReview.score}/${test.total_marks}`
                    : "-"}
                </p>
                {isEvaluated && (
                  <Badge
                    className={
                      isPassed ? "bg-green-500 mt-1" : "bg-red-500 mt-1"
                    }
                  >
                    {isPassed ? "Pass" : "Fail"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prelims - Questions and Answers */}
      {isPrelims && isEvaluated && (
        <Card>
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
            <CardDescription>
              Review student's answers for each question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {attemptReview.total_questions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {attemptReview.attempted_questions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Attempted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {attemptReview.correct_answers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {attemptReview.wrong_answers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Wrong</p>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((question) => {
                  const answer = answersMap.get(question.id);
                  const isCorrect = answer?.is_correct === true;
                  const isWrong = answer?.is_correct === false;
                  const isUnanswered = !answer || answer.selected_option === null;

                  return (
                    <Card
                      key={question.id}
                      className={`${
                        isCorrect
                          ? "border-green-500 bg-green-50"
                          : isWrong
                          ? "border-red-500 bg-red-50"
                          : "bg-white"
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                              {question.question_number}
                            </span>
                            <Badge variant="outline">{question.marks} marks</Badge>
                          </div>
                          {isCorrect && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Correct (+{answer.marks_obtained})
                            </Badge>
                          )}
                          {isWrong && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Wrong ({answer.marks_obtained})
                            </Badge>
                          )}
                          {isUnanswered && (
                            <Badge variant="outline">Unanswered</Badge>
                          )}
                        </div>

                        <p className="mb-4 font-medium">{question.question_text}</p>

                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((opt) => {
                            const isStudentAnswer =
                              answer?.selected_option === opt.option_number;
                            const isCorrectOption =
                              opt.option_number === question.correct_option;

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded border ${
                                  isCorrectOption
                                    ? "border-green-500 bg-green-100"
                                    : isStudentAnswer
                                    ? "border-red-500 bg-red-100"
                                    : "border-slate-200"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isCorrectOption && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                  {isStudentAnswer && !isCorrectOption && (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Option {opt.option_number}:
                                  </span>
                                  <span className="text-sm">{opt.option_text}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {question.solution && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Solution:
                            </p>
                            <p className="text-sm text-blue-800">
                              {question.solution}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mains - Files and Evaluation */}
      {isMains && (
        <div className="space-y-6">
          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>Question paper and answer files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <p className="font-medium">Question Paper</p>
                  </div>
                  {test.question_file_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={test.question_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not available</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <p className="font-medium">Student Answer</p>
                  </div>
                  {attemptReview.answer_file_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={attemptReview.answer_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation */}
          {!isEvaluated ? (
            <Card>
              <CardHeader>
                <CardTitle>Evaluate Submission</CardTitle>
                <CardDescription>
                  Provide score and remarks for this submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-xl">
                  <div>
                    <Label>Score (out of {test.total_marks})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={test.total_marks}
                      value={evaluationData.score}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          score: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter score"
                    />
                  </div>

                  <div>
                    <Label>Remarks (optional)</Label>
                    <Textarea
                      value={evaluationData.remarks}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          remarks: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Enter evaluation remarks..."
                    />
                  </div>

                  <Button
                    onClick={handleEvaluate}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Evaluation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Evaluation</CardTitle>
                <CardDescription>Faculty evaluation details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Score</p>
                      <p className="text-2xl font-bold">
                        {attemptReview.score}/{test.total_marks}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Percentage
                      </p>
                      <p className="text-2xl font-bold">
                        {attemptReview.percentage?.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {attemptReview.evaluation_remarks && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Remarks:</p>
                      <p className="text-sm">{attemptReview.evaluation_remarks}</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Evaluated at:{" "}
                    {attemptReview.evaluated_at
                      ? new Date(attemptReview.evaluated_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
