"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/app/(services)/[service]/page"

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onOpenSettings: () => void
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectChat,
  onOpenSettings,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="p-2">
        <Button className="w-full justify-start" onClick={onNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {conversations
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((convo) => (
              <Button
                key={convo.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  activeConversationId === convo.id && "bg-accent text-accent-foreground",
                )}
                onClick={() => onSelectChat(convo.id)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="truncate">{convo.title}</span>
              </Button>
            ))}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <Button variant="ghost" className="w-full justify-start" onClick={onOpenSettings}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}
