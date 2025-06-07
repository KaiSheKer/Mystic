"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged, type User } from "firebase/auth"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatView } from "@/components/chat/chat-view"
import { PromptManager } from "@/components/chat/prompt-manager"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Message } from "ai/react"

export interface Conversation {
  id: string
  title: string
  createdAt: any // Firestore timestamp
  updatedAt: any
  serviceSlug: string
  messages?: Message[] // Messages will be loaded on demand or with the conversation
}

const serviceDetails: { [key: string]: { name: string } } = {
  bazi: { name: "BaZi Astrology" },
  "natal-chart": { name: "Natal Chart Reading" },
  tarot: { name: "Tarot Card Reading" },
  "daily-horoscope": { name: "Daily Horoscope" },
}

export default function ServiceChatPage() {
  const params = useParams()
  const serviceSlug = typeof params.service === "string" ? params.service : ""
  const currentService = serviceDetails[serviceSlug] || { name: "Divination Service" }

  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [promptManagerOpen, setPromptManagerOpen] = useState(false)

  // Local state for unregistered users
  const [localConvo, setLocalConvo] = useLocalStorage<Conversation | null>("unregistered-convo", null)
  const [localUsage, setLocalUsage] = useLocalStorage<number>("unregistered-usage", 0)
  const [localUsageDate, setLocalUsageDate] = useLocalStorage<string>("unregistered-date", "")

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        setLoading(false)
        const today = new Date().toISOString().split("T")[0]
        if (localUsageDate !== today) {
          setLocalUsage(0)
          setLocalUsageDate(today)
          setLocalConvo(null)
        }
      }
    })
    return () => unsubscribe()
  }, [setLocalConvo, setLocalUsage, setLocalUsageDate])

  // Fetch conversations for logged-in users
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", user.uid),
      where("serviceSlug", "==", serviceSlug),
      orderBy("updatedAt", "desc"),
    )
    const querySnapshot = await getDocs(q)
    const convos = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Conversation[]
    setConversations(convos)
    if (convos.length > 0) {
      handleSelectChat(convos[0].id)
    }
    setLoading(false)
  }, [user, serviceSlug])

  useEffect(() => {
    fetchConversations()
  }, [user, fetchConversations])

  const handleSelectChat = async (id: string) => {
    const convo = conversations.find((c) => c.id === id)
    if (!convo) return
    if (!convo.messages) {
      // Fetch messages for this convo if not already loaded
      const messagesQuery = query(collection(db, `conversations/${id}/messages`), orderBy("createdAt", "asc"))
      const messagesSnapshot = await getDocs(messagesQuery)
      convo.messages = messagesSnapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          role: data.role,
          content: data.content,
          createdAt: data.createdAt.toDate(),
        }
      }) as Message[]
    }
    setActiveConversation({ ...convo })
  }

  const handleNewChat = async () => {
    if (user) {
      // Logged-in user
      const newConvoRef = await addDoc(collection(db, "conversations"), {
        userId: user.uid,
        title: "New Conversation",
        serviceSlug: serviceSlug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      const newConvo = {
        id: newConvoRef.id,
        title: "New Conversation",
        userId: user.uid,
        serviceSlug: serviceSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      }
      setConversations([newConvo, ...conversations])
      setActiveConversation(newConvo)
    } else {
      // Unregistered user
      const today = new Date().toISOString().split("T")[0]
      if (localUsageDate !== today) {
        // Reset if new day
        setLocalUsage(0)
        setLocalUsageDate(today)
      }
      if (localUsage >= 1) {
        alert("You have reached your daily usage limit for today.")
        return
      }
      const newConvo = {
        id: "local",
        title: "New Conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serviceSlug,
        messages: [],
      }
      setLocalConvo(newConvo)
      setActiveConversation(newConvo)
    }
  }

  const handleNewMessage = async (chatId: string, message: Message) => {
    if (user && chatId !== "local") {
      // Logged-in user
      const convoRef = doc(db, "conversations", chatId)
      const messagesRef = collection(convoRef, "messages")

      const batch = writeBatch(db)
      batch.update(convoRef, { updatedAt: serverTimestamp() })
      const messageDoc = doc(messagesRef, message.id)
      batch.set(messageDoc, { ...message, createdAt: serverTimestamp() })

      await batch.commit()

      // Update local state optimistically
      setConversations((prev) => prev.map((c) => (c.id === chatId ? { ...c, updatedAt: new Date() } : c)))
    } else {
      // Unregistered user
      if (activeConversation) {
        const updatedMessages = [...(activeConversation.messages || []), message]
        const updatedConvo = { ...activeConversation, messages: updatedMessages }
        setLocalConvo(updatedConvo)
        setActiveConversation(updatedConvo)
        if (message.role === "user") {
          setLocalUsage(localUsage + 1)
        }
      }
    }
  }

  const activeChat = user ? activeConversation : localConvo

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <ChatSidebar
        conversations={user ? conversations : localConvo ? [localConvo] : []}
        activeConversationId={activeChat?.id || null}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onOpenSettings={() => setPromptManagerOpen(true)} // Can repurpose settings button
      />
      <main className="flex-1">
        {activeChat ? (
          <ChatView
            key={activeChat.id}
            chatId={activeChat.id}
            serviceName={currentService.name}
            serviceSlug={serviceSlug}
            initialMessages={activeChat.messages || []}
            user={user}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold">Select or Start a Conversation</h2>
            <p className="text-muted-foreground">
              {loading
                ? "Loading..."
                : user
                  ? "Choose a past reading or start a new one."
                  : "Login for full features or start a temporary chat."}
            </p>
            <Button onClick={handleNewChat} className="mt-4" disabled={loading}>
              New Conversation
            </Button>
          </div>
        )}
      </main>
      <PromptManager open={promptManagerOpen} onOpenChange={setPromptManagerOpen} />
    </div>
  )
}
