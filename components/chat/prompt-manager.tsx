"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { collection, getDocs, doc, setDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Prompt {
  id: string
  content: string
}

interface PromptManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PromptManager({ open, onOpenChange }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [currentContent, setCurrentContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const fetchPrompts = async () => {
        setIsLoading(true)
        const promptsCollection = collection(db, "prompts")
        const promptSnapshot = await getDocs(promptsCollection)
        const promptList = promptSnapshot.docs.map((d) => ({ id: d.id, content: d.data().content }))
        setPrompts(promptList)
        if (promptList.length > 0) {
          setSelectedPromptId(promptList[0].id)
          setCurrentContent(promptList[0].content)
        }
        setIsLoading(false)
      }
      fetchPrompts()
    }
  }, [open])

  const handleSelectChange = (id: string) => {
    setSelectedPromptId(id)
    const selected = prompts.find((p) => p.id === id)
    if (selected) {
      setCurrentContent(selected.content)
    }
  }

  const handleSave = async () => {
    if (!selectedPromptId) return
    setIsLoading(true)
    const promptRef = doc(db, "prompts", selectedPromptId)
    await setDoc(promptRef, { content: currentContent }, { merge: true })
    setIsLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prompt Management</DialogTitle>
          <DialogDescription>Configure the system prompts used by the AI for different services.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Divination Service</Label>
            <Select value={selectedPromptId} onValueChange={handleSelectChange}>
              <SelectTrigger id="prompt-select">
                <SelectValue placeholder="Select a service prompt" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-content">System Prompt</Label>
            <Textarea
              id="prompt-content"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={10}
              placeholder="Enter the system prompt..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
