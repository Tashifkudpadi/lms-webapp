"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Plus, CalendarIcon, Clock, FileText, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateTestFormProps {
  children: React.ReactNode
}

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  question: string
  options?: string[]
  correctAnswer?: string | number
  points: number
}

export default function CreateTestForm({ children }: CreateTestFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dueDate, setDueDate] = useState<Date>()
  const [availableFrom, setAvailableFrom] = useState<Date>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: "multiple-choice",
    question: "",
    options: ["", "", "", ""],
    points: 1,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setOpen(false)
      // Reset form or show success message
    }, 2000)
  }

  const addQuestion = () => {
    if (currentQuestion.question && currentQuestion.type) {
      const newQuestion: Question = {
        id: Date.now().toString(),
        type: currentQuestion.type as Question["type"],
        question: currentQuestion.question,
        options: currentQuestion.options?.filter((opt) => opt.trim() !== ""),
        correctAnswer: currentQuestion.correctAnswer,
        points: currentQuestion.points || 1,
      }
      setQuestions([...questions, newQuestion])
      setCurrentQuestion({
        type: "multiple-choice",
        question: "",
        options: ["", "", "", ""],
        points: 1,
      })
    }
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateCurrentQuestionOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || ["", "", "", ""])]
    newOptions[index] = value
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Create New Test
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Create a comprehensive test with multiple question types and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Test Information
              </CardTitle>
              <CardDescription>Basic details about your test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-title" className="text-slate-700 font-medium">
                    Test Title *
                  </Label>
                  <Input
                    id="test-title"
                    placeholder="e.g., JavaScript Fundamentals Quiz"
                    required
                    className="bg-white/80 border-gray-200 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-slate-700 font-medium">
                    Course *
                  </Label>
                  <Select required>
                    <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-500">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-dev-101">Introduction to Web Development</SelectItem>
                      <SelectItem value="react-advanced">Advanced React Patterns</SelectItem>
                      <SelectItem value="database-design">Database Design Fundamentals</SelectItem>
                      <SelectItem value="flutter-mobile">Mobile App Development with Flutter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-description" className="text-slate-700 font-medium">
                  Description
                </Label>
                <Textarea
                  id="test-description"
                  placeholder="Brief description of what this test covers..."
                  className="bg-white/50 border-slate-200 focus:border-blue-500 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-700 font-medium">
                    Duration (minutes) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 60"
                    required
                    min="1"
                    max="300"
                    className="bg-white/50 border-slate-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attempts" className="text-slate-700 font-medium">
                    Max Attempts *
                  </Label>
                  <Input
                    id="attempts"
                    type="number"
                    placeholder="e.g., 2"
                    required
                    min="1"
                    max="10"
                    className="bg-white/50 border-slate-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing-score" className="text-slate-700 font-medium">
                    Passing Score (%)
                  </Label>
                  <Input
                    id="passing-score"
                    type="number"
                    placeholder="e.g., 70"
                    min="0"
                    max="100"
                    className="bg-white/50 border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Schedule & Availability
              </CardTitle>
              <CardDescription>Set when the test will be available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Available From *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white/50 border-slate-200",
                          !availableFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableFrom ? format(availableFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={availableFrom} onSelect={setAvailableFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white/50 border-slate-200",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Questions ({questions.length}) - Total Points: {totalPoints}
              </CardTitle>
              <CardDescription>Add questions to your test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Question Form */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white/30">
                <h4 className="font-semibold text-slate-900 mb-4">Add New Question</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Question Type</Label>
                      <Select
                        value={currentQuestion.type}
                        onValueChange={(value) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            type: value as Question["type"],
                            options: value === "multiple-choice" ? ["", "", "", ""] : undefined,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                          <SelectItem value="short-answer">Short Answer</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Points</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={currentQuestion.points || 1}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, points: Number.parseInt(e.target.value) || 1 })
                        }
                        className="bg-white/50 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Question</Label>
                    <Textarea
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                      placeholder="Enter your question here..."
                      className="bg-white/50 border-slate-200"
                    />
                  </div>

                  {currentQuestion.type === "multiple-choice" && (
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">Answer Options</Label>
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 w-8">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <Input
                            value={option}
                            onChange={(e) => updateCurrentQuestionOption(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="bg-white/50 border-slate-200"
                          />
                          <input
                            type="radio"
                            name="correct-answer"
                            value={index}
                            onChange={(e) =>
                              setCurrentQuestion({ ...currentQuestion, correctAnswer: Number.parseInt(e.target.value) })
                            }
                            className="text-blue-600"
                          />
                          <span className="text-xs text-slate-500">Correct</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === "true-false" && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Correct Answer</Label>
                      <Select
                        value={currentQuestion.correctAnswer as string}
                        onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, correctAnswer: value })}
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200">
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button type="button" onClick={addQuestion} className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Added Questions</h4>
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-3 border border-slate-200 rounded-lg bg-white/20">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge variant="secondary">{question.points} pts</Badge>
                          </div>
                          <p className="text-sm text-slate-900 font-medium">
                            {index + 1}. {question.question}
                          </p>
                          {question.options && (
                            <div className="mt-2 text-xs text-slate-600">Options: {question.options.join(", ")}</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                Test Settings
              </CardTitle>
              <CardDescription>Configure additional test options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Shuffle Questions</Label>
                      <p className="text-sm text-slate-600">Randomize question order for each student</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Show Results Immediately</Label>
                      <p className="text-sm text-slate-600">Display results after submission</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Allow Review</Label>
                      <p className="text-sm text-slate-600">Let students review their answers</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Require Webcam</Label>
                      <p className="text-sm text-slate-600">Enable proctoring during test</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Lock Browser</Label>
                      <p className="text-sm text-slate-600">Prevent switching to other tabs</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Time Warning</Label>
                      <p className="text-sm text-slate-600">Show warning before time expires</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/30">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || questions.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Test...
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
