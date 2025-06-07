"use client"

import { useRef, useEffect, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SendHorizonal, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat, type Message } from "ai/react"

interface ChatInterfaceProps {
  serviceName: string
  serviceSlug: string
}

export default function ChatInterface({ serviceName, serviceSlug }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: {
      serviceSlug, // Send serviceSlug to the API
    },
    onFinish: () => {
      // Optional: any action to take when streaming finishes
    },
    onError: (error) => {
      console.error("Chat error:", error)
      // Add a custom error message to the chat
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date(), // useChat expects createdAt
      }
      setMessages((prev) => [...prev, errorMessage])
    },
  })

  const getFormattedTimestamp = (date?: Date) => {
    if (!date) return ""
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Initial greeting message from the assistant
  useEffect(() => {
    // Check if messages array is empty to avoid adding greeting multiple times
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Welcome to your ${serviceName} session! How can I assist you today?`,
          createdAt: new Date(),
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceName]) // Keep serviceName as dependency, setMessages is stable

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("div > div") // Target the inner scrollable div
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg max-w-[75%]",
              msg.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={msg.role === "user" ? "/user-avatar.png" : "/bot-avatar.png"} />
              <AvatarFallback>{msg.role === "user" ? <User size={16} /> : <Sparkles size={16} />}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p> {/* Added whitespace-pre-wrap */}
              <p className="text-xs mt-1 opacity-70">{getFormattedTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        {/* The useChat hook handles the loading state implicitly by updating messages array */}
        {/* If you want a specific loading indicator while streaming, you might need custom logic */}
        {/* For now, the assistant's message will just grow as it streams. */}
        {/* If isLoading is true and the last message isn't from assistant, you could show a spinner */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-start gap-3 p-3 rounded-lg max-w-[75%] bg-muted">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback>
                <Sparkles size={16} className="animate-pulse" />
              </AvatarFallback>
            </Avatar>
            <p className="text-sm italic">Consulting the stars...</p>
          </div>
        )}
      </ScrollArea>
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => handleSubmit(e)}
        className="sticky bottom-0 border-t bg-background p-4"
      >
        <div className="relative">
          <Input
            type="text"
            placeholder={`Ask about ${serviceName}...`}
            value={input}
            onChange={handleInputChange}
            className="pr-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            <SendHorizonal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
