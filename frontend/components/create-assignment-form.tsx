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
import { Plus, CalendarIcon, Upload, FileText, Settings, X, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateAssignmentFormProps {
  children: React.ReactNode
}

export default function CreateAssignmentForm({ children }: CreateAssignmentFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dueDate, setDueDate] = useState<Date>()
  const [availableFrom, setAvailableFrom] = useState<Date>()
  const [rubricCriteria, setRubricCriteria] = useState<string[]>([])
  const [newCriterion, setNewCriterion] = useState("")
  const [resources, setResources] = useState<string[]>([])
  const [newResource, setNewResource] = useState("")

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

  const addRubricCriterion = () => {
    if (newCriterion.trim() && !rubricCriteria.includes(newCriterion.trim())) {
      setRubricCriteria([...rubricCriteria, newCriterion.trim()])
      setNewCriterion("")
    }
  }

  const removeRubricCriterion = (criterion: string) => {
    setRubricCriteria(rubricCriteria.filter((c) => c !== criterion))
  }

  const addResource = () => {
    if (newResource.trim() && !resources.includes(newResource.trim())) {
      setResources([...resources, newResource.trim()])
      setNewResource("")
    }
  }

  const removeResource = (resource: string) => {
    setResources(resources.filter((r) => r !== resource))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Create New Assignment
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Create a detailed assignment with instructions, resources, and grading criteria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Assignment Information
              </CardTitle>
              <CardDescription>Basic details about your assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-title" className="text-slate-700 font-medium">
                    Assignment Title *
                  </Label>
                  <Input
                    id="assignment-title"
                    placeholder="e.g., Build a Responsive Website"
                    required
                    className="bg-white/80 border-gray-200 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-slate-700 font-medium">
                    Course *
                  </Label>
                  <Select required>
                    <SelectTrigger className="bg-white/80 border-gray-200 focus:border-amber-500">
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
                <Label htmlFor="assignment-description" className="text-slate-700 font-medium">
                  Description *
                </Label>
                <Textarea
                  id="assignment-description"
                  placeholder="Provide a clear description of what students need to accomplish..."
                  required
                  className="bg-white/80 border-gray-200 focus:border-amber-500 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailed-instructions" className="text-slate-700 font-medium">
                  Detailed Instructions
                </Label>
                <Textarea
                  id="detailed-instructions"
                  placeholder="Step-by-step instructions, requirements, and expectations..."
                  className="bg-white/80 border-gray-200 focus:border-amber-500 min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-type" className="text-slate-700 font-medium">
                    Assignment Type *
                  </Label>
                  <Select required>
                    <SelectTrigger className="bg-white/80 border-gray-200 focus:border-amber-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group Project</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="coding">Coding Project</SelectItem>
                      <SelectItem value="design">Design Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-slate-700 font-medium">
                    Difficulty Level
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-white/80 border-gray-200 focus:border-amber-500">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-score" className="text-slate-700 font-medium">
                    Maximum Score *
                  </Label>
                  <Input
                    id="max-score"
                    type="number"
                    placeholder="e.g., 100"
                    required
                    min="1"
                    max="1000"
                    className="bg-white/80 border-gray-200 focus:border-amber-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Submission */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                Schedule & Submission
              </CardTitle>
              <CardDescription>Set deadlines and submission requirements</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-format" className="text-slate-700 font-medium">
                    Submission Format *
                  </Label>
                  <Select required>
                    <SelectTrigger className="bg-white/80 border-gray-200 focus:border-amber-500">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file-upload">File Upload</SelectItem>
                      <SelectItem value="text-entry">Text Entry</SelectItem>
                      <SelectItem value="url-submission">URL Submission</SelectItem>
                      <SelectItem value="multiple-files">Multiple Files</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-attempts" className="text-slate-700 font-medium">
                    Max Submission Attempts
                  </Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    placeholder="e.g., 3"
                    min="1"
                    max="10"
                    className="bg-white/80 border-gray-200 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-types" className="text-slate-700 font-medium">
                  Allowed File Types
                </Label>
                <Input
                  id="file-types"
                  placeholder="e.g., .pdf, .docx, .zip, .html"
                  className="bg-white/80 border-gray-200 focus:border-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resources & Materials */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-purple-600" />
                Resources & Materials
              </CardTitle>
              <CardDescription>Provide helpful resources for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Reference Materials</Label>
                <div className="flex gap-2">
                  <Input
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    placeholder="Add a resource link or description..."
                    className="bg-white/80 border-gray-200 focus:border-amber-500"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResource())}
                  />
                  <Button type="button" onClick={addResource} size="sm" variant="outline">
                    Add
                  </Button>
                </div>
                {resources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resources.map((resource, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {resource}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => removeResource(resource)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Attachment Files</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white/30">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="mt-2">
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Upload reference materials, templates, or examples</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading Rubric */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                Grading Rubric
              </CardTitle>
              <CardDescription>Define grading criteria and expectations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Grading Criteria</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    placeholder="Add a grading criterion..."
                    className="bg-white/80 border-gray-200 focus:border-amber-500"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRubricCriterion())}
                  />
                  <Button type="button" onClick={addRubricCriterion} size="sm" variant="outline">
                    Add
                  </Button>
                </div>
                {rubricCriteria.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rubricCriteria.map((criterion, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {criterion}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => removeRubricCriterion(criterion)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grading-notes" className="text-slate-700 font-medium">
                  Grading Notes
                </Label>
                <Textarea
                  id="grading-notes"
                  placeholder="Additional notes for grading this assignment..."
                  className="bg-white/80 border-gray-200 focus:border-amber-500 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment Settings */}
          <Card className="bg-white/60 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Assignment Settings
              </CardTitle>
              <CardDescription>Configure additional assignment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Allow Late Submissions</Label>
                      <p className="text-sm text-slate-600">Accept submissions after due date</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Peer Review</Label>
                      <p className="text-sm text-slate-600">Enable peer evaluation</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Anonymous Grading</Label>
                      <p className="text-sm text-slate-600">Hide student names during grading</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Plagiarism Check</Label>
                      <p className="text-sm text-slate-600">Run automatic plagiarism detection</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Email Notifications</Label>
                      <p className="text-sm text-slate-600">Notify students about assignment</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Group Assignment</Label>
                      <p className="text-sm text-slate-600">Allow group submissions</p>
                    </div>
                    <Switch />
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
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Assignment...
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
