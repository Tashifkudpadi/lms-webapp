import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Upload, CheckCircle, TrendingUp, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import CreateAssignmentForm from "@/components/create-assignment-form"
import Image from "next/image"

export default function AssignmentsPage() {
  // Sample assignments data
  const assignments = [
    {
      id: "1",
      title: "Build a Responsive Website",
      course: "Introduction to Web Development",
      description: "Create a responsive website using HTML, CSS, and JavaScript with modern design principles",
      dueDate: "Oct 20, 2023",
      submittedDate: null,
      status: "In Progress",
      progress: 60,
      attachments: 2,
      maxScore: 100,
      difficulty: "Medium",
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "2",
      title: "React State Management Project",
      course: "Advanced React Patterns",
      description: "Implement a complex state management solution using React hooks and context API",
      dueDate: "Oct 25, 2023",
      submittedDate: null,
      status: "Not Started",
      progress: 0,
      attachments: 1,
      maxScore: 100,
      difficulty: "Hard",
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "3",
      title: "Database Schema Design",
      course: "Database Design Fundamentals",
      description: "Design a normalized database schema for an e-commerce platform with proper relationships",
      dueDate: "Oct 12, 2023",
      submittedDate: "Oct 10, 2023",
      status: "Submitted",
      progress: 100,
      attachments: 3,
      grade: "A",
      score: 95,
      maxScore: 100,
      feedback: "Excellent work on normalization and indexing strategy. Great attention to detail.",
      difficulty: "Medium",
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "4",
      title: "Mobile App UI Design",
      course: "Mobile App Development with Flutter",
      description: "Create a comprehensive UI design for a mobile application with user-friendly interface",
      dueDate: "Nov 15, 2023",
      submittedDate: null,
      status: "Not Started",
      progress: 0,
      attachments: 1,
      maxScore: 100,
      difficulty: "Easy",
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative">
      {/* Dots Background Pattern */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0, 15px 15px",
        }}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
              <TrendingUp className="w-4 h-4" />
              Assignment Hub
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground text-lg">View and submit your course assignments</p>
          </div>
          <CreateAssignmentForm>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </CreateAssignmentForm>
        </div>

        {/* Content */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200">
                <TabsTrigger value="all">All Assignments</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                <TabsTrigger value="not-started">Not Started</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="in-progress" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assignments
                    .filter((assignment) => assignment.status === "In Progress")
                    .map((assignment) => (
                      <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="submitted" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assignments
                    .filter((assignment) => assignment.status === "Submitted")
                    .map((assignment) => (
                      <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="not-started" className="space-y-4 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {assignments
                    .filter((assignment) => assignment.status === "Not Started")
                    .map((assignment) => (
                      <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AssignmentCard({ assignment }: { assignment: any }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "In Progress":
        return "default"
      case "Not Started":
        return "secondary"
      case "Submitted":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "secondary"
      case "Medium":
        return "default"
      case "Hard":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image src={assignment.thumbnail || "/placeholder.svg"} alt={assignment.title} fill className="object-cover" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={getStatusVariant(assignment.status)}>{assignment.status}</Badge>
          <Badge variant={getDifficultyVariant(assignment.difficulty)}>{assignment.difficulty}</Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
        <CardDescription className="text-primary font-medium">{assignment.course}</CardDescription>
        <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due: {assignment.dueDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {assignment.attachments} {assignment.attachments === 1 ? "file" : "files"}
              </span>
            </div>
            {assignment.submittedDate && (
              <div className="flex items-center gap-2 col-span-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Submitted: {assignment.submittedDate}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{assignment.progress}%</span>
            </div>
            <Progress value={assignment.progress} className="h-2" />
          </div>

          {assignment.grade && (
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Grade:</span>
                <span className="ml-2 text-lg font-bold text-primary">{assignment.grade}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {assignment.score}/{assignment.maxScore}
              </div>
            </div>
          )}

          {assignment.feedback && (
            <div className="pt-2 border-t">
              <Button variant="ghost" size="sm" className="p-0 h-auto font-medium">
                View Feedback
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            {assignment.status === "Submitted" ? (
              <Button variant="outline" size="sm">
                View Submission
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  {assignment.status === "In Progress" ? "Continue" : "Start"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
