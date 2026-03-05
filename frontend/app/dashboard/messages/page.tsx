"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
} from "@/store/messages";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { conversations, currentMessages, loading } = useAppSelector(
    (s) => s.messagesReducer
  );
  const { user } = useAppSelector((s) => s.authReducer);
  const [selectedConvo, setSelectedConvo] = useState<{
    courseId: number;
    otherUserId: number;
    otherUserName: string;
    courseName: string;
  } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSelectConvo = (
    courseId: number,
    otherUserId: number,
    otherUserName: string,
    courseName: string
  ) => {
    setSelectedConvo({ courseId, otherUserId, otherUserName, courseName });
    dispatch(fetchMessages({ courseId, otherUserId }));
  };

  const handleSend = async () => {
    if (!selectedConvo || !reply.trim()) return;
    setSending(true);
    const result = await dispatch(
      sendMessage({
        course_id: selectedConvo.courseId,
        recipient_id: selectedConvo.otherUserId,
        content: reply.trim(),
      })
    );
    setSending(false);
    if (result.meta.requestStatus === "fulfilled") {
      setReply("");
    } else {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          View and manage your conversations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations list */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={`${c.other_user_id}-${c.course_id}`}
                  onClick={() =>
                    handleSelectConvo(
                      c.course_id,
                      c.other_user_id,
                      c.other_user_name,
                      c.course_name
                    )
                  }
                  className={cn(
                    "p-3 border-b cursor-pointer hover:bg-slate-50 transition-colors",
                    selectedConvo?.courseId === c.course_id &&
                      selectedConvo?.otherUserId === c.other_user_id &&
                      "bg-blue-50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {c.other_user_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.course_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {c.last_message}
                      </p>
                    </div>
                    {c.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-xs ml-2 shrink-0"
                      >
                        {c.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Message thread */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedConvo ? (
            <>
              <div className="p-3 border-b shrink-0">
                <p className="text-sm font-medium">
                  {selectedConvo.otherUserName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedConvo.courseName}
                </p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[80%] p-3 rounded-lg text-sm",
                        msg.sender_id === user?.id
                          ? "ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-slate-100"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          msg.sender_id === user?.id
                            ? "text-white/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(msg.created_at).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2 shrink-0">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!reply.trim() || sending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
