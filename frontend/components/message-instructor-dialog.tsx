"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourseFaculty, sendMessage } from "@/store/messages";

interface Props {
  courseId: number;
}

export default function MessageInstructorDialog({ courseId }: Props) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { courseFaculty } = useAppSelector((s) => s.messagesReducer);
  const [open, setOpen] = useState(false);
  const [selectedFacultyUserId, setSelectedFacultyUserId] = useState<string>("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchCourseFaculty(courseId));
    }
  }, [open, courseId, dispatch]);

  useEffect(() => {
    if (courseFaculty.length === 1) {
      setSelectedFacultyUserId(String(courseFaculty[0].user_id));
    }
  }, [courseFaculty]);

  const handleSend = async () => {
    if (!selectedFacultyUserId || !content.trim()) return;
    setSending(true);
    const result = await dispatch(
      sendMessage({
        course_id: courseId,
        recipient_id: Number(selectedFacultyUserId),
        content: content.trim(),
      })
    );
    setSending(false);
    if (result.meta.requestStatus === "fulfilled") {
      toast({ title: "Message sent", variant: "success" });
      setContent("");
      setSelectedFacultyUserId("");
      setOpen(false);
    } else {
      toast({
        title: "Failed to send message",
        description: (result as any)?.payload || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          Message Instructor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message Instructor</DialogTitle>
          <DialogDescription>
            Send a message to a faculty member for this course.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {courseFaculty.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No faculty members assigned to this course.
            </p>
          )}
          {courseFaculty.length > 1 && (
            <Select
              value={selectedFacultyUserId}
              onValueChange={setSelectedFacultyUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {courseFaculty.map((f) => (
                  <SelectItem key={f.user_id} value={String(f.user_id)}>
                    {f.name} ({f.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {courseFaculty.length === 1 && (
            <p className="text-sm text-muted-foreground">
              To: <strong>{courseFaculty[0].name}</strong>
            </p>
          )}
          <Textarea
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleSend}
            disabled={
              !selectedFacultyUserId ||
              !content.trim() ||
              sending ||
              courseFaculty.length === 0
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
