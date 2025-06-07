"use client"

import { useRef, useEffect, type FormEvent } from "react"
import { useChat, type Message } from "ai/react"
import { auth } from "@/lib/firebase/client" // Import Firebase auth
import type { User } from "firebase/auth"

// Import existing components
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SendHorizonal, UserIcon, Sparkles } from "lucide-react" // Renamed User to avoid conflict
import { cn } from "@/lib/utils"

interface ChatViewProps {
  serviceName: string
  serviceSlug: string
  chatId: string
  initialMessages: Message[]
  user: User | null // Pass user object
  onNewMessage: (id: string, message: Message) => void
}

export function ChatView({ serviceName, serviceSlug, chatId, initialMessages, user, onNewMessage }: ChatViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages,
    // Add the auth token to the headers for every request
    headers: {
      Authorization: `Bearer ${auth.currentUser?.getIdToken()}`,
    },
    body: {
      serviceSlug,
    },
    onFinish: (message) => {
      // When AI finishes, save the completed message
      onNewMessage(chatId, message)
    },
    onError: (err) => {
      console.error("Chat view error:", err)
      // Display a user-friendly error in the chat
    },
  })

  // This effect is crucial to update the chat when the user selects a different conversation
  useEffect(() => {
    setMessages(initialMessages)
  }, [chatId, initialMessages, setMessages])

  // Update headers when user logs in/out
  useEffect(() => {
    const setAuthHeader = async () => {
      if (user) {
        const token = await user.getIdToken()
        // The headers in useChat are not dynamically updatable in this version.
        // A common pattern is to re-key the component or handle this in a custom handleSubmit.
        // For now, we rely on the initial token from auth.currentUser.
        // A page refresh after login ensures the token is fresh.
      }
    }
    setAuthHeader()
  }, [user])

  const customHandleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    // For logged-in users, get a fresh token before submitting
    const headers: Record<string, string> = {}
    if (user) {
      try {
        const token = await user.getIdToken(true) // Force refresh token
        headers["Authorization"] = `Bearer ${token}`
      } catch (tokenError) {
        console.error("Could not get auth token:", tokenError)
        // Optionally show an error to the user
        return
      }
    } else {
      // Handle unregistered user submission, which doesn't hit the API
      // This is a simplified logic. A more robust solution might use a different API route.
      const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input }
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Please log in to use the AI chat feature. Your conversation history is not being saved.",
      }
      setMessages([...messages, userMessage, aiMessage])
      onNewMessage(chatId, userMessage)
      onNewMessage(chatId, aiMessage)
      return
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input }
    // Add user message to state and save it
    onNewMessage(chatId, userMessage)

    handleSubmit(e, {
      options: {
        headers,
      },
    })
  }

  // Formatting and rendering logic (remains mostly the same)
  const getFormattedTimestamp = (dateInput?: Date) => {
    if (!dateInput) return ""
    // Ensure dateInput is a Date object
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

    // Check if the date is valid after conversion/assertion
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      // console.warn("Invalid date provided to getFormattedTimestamp:", dateInput);
      return "" // Or return a placeholder like "Invalid Date"
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("div > div")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header and ScrollArea (same as before) */}
      <header className="p-4 border-b">
        <h1 className="text-xl font-semibold flex items-center">
          <Sparkles className="h-6 w-6 mr-2" />
          {serviceName}
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="mx-auto max-w-3xl p-4 space-y-4">
            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-destructive">
                <p className="font-bold">An error occurred:</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={msg.role === "user" ? user?.photoURL || undefined : "/bot-avatar.png"} />
                  <AvatarFallback>
                    {msg.role === "user" ? <UserIcon size={16} /> : <Sparkles size={16} />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">{getFormattedTimestamp(msg.createdAt)}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>
                    <Sparkles size={16} className="animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm italic">Consulting the stars...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="border-t bg-background p-4">
        <form onSubmit={customHandleSubmit} className="mx-auto max-w-3xl">
          <div className="relative">
            <Input
              type="text"
              placeholder={user ? `Ask about ${serviceName}...` : "Please log in to chat"}
              value={input}
              onChange={handleInputChange}
              className="pr-12"
              disabled={isLoading || !user}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={isLoading || !input.trim() || !user}
            >
              <SendHorizonal className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
