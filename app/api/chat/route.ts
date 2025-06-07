import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { adminAuth, adminDb } from "@/lib/firebase/server"
import { Timestamp } from "firebase-admin/firestore"

// This is not an edge function, it needs Node.js runtime for Firebase Admin
export const dynamic = "force-dynamic"

// Define user tiers
type UserTier = "unregistered" | "free" | "subscribed"
const usageLimits = {
  unregistered: 1,
  free: 5,
  subscribed: Number.POSITIVE_INFINITY,
}

export async function POST(req: Request) {
  try {
    const { messages, serviceSlug } = await req.json()
    const authToken = req.headers.get("Authorization")?.split("Bearer ")[1]

    if (!authToken) {
      return new Response("Unauthorized: No auth token provided.", { status: 401 })
    }

    // 1. Verify user identity
    const decodedToken = await adminAuth.verifyIdToken(authToken)
    const userId = decodedToken.uid

    // 2. Fetch user data from Firestore
    const userDocRef = adminDb.collection("users").doc(userId)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      // First time user, create their profile
      await userDocRef.set({
        email: decodedToken.email,
        tier: "free",
        dailyUsageCount: 0,
        lastUsageDate: null,
        createdAt: Timestamp.now(),
      })
    }
    const userData = (userDoc.data() || { tier: "free", dailyUsageCount: 0 }) as {
      tier: UserTier
      dailyUsageCount: number
      lastUsageDate?: Timestamp
    }

    // 3. Check usage limits
    const tier = userData.tier
    const limit = usageLimits[tier]
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
    const lastUsageDate = userData.lastUsageDate?.toDate().toISOString().split("T")[0]

    let currentUsage = userData.dailyUsageCount || 0
    if (lastUsageDate !== today) {
      currentUsage = 0 // Reset daily count
    }

    if (currentUsage >= limit) {
      return new Response("Daily usage limit reached for your tier.", { status: 429 })
    }

    // 4. Fetch system prompt
    const promptDoc = await adminDb.collection("prompts").doc(serviceSlug).get()
    const systemPrompt = promptDoc.exists ? promptDoc.data()?.content : "You are a helpful assistant."

    // 5. Interact with Gemini model
    const result = await streamText({
      model: google("models/gemini-1.5-flash-latest"), // Or another Gemini model
      system: systemPrompt,
      messages: messages, // Assuming messages are already in Vercel AI SDK format
    })

    // 6. Increment usage count in a transaction
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(userDocRef, {
        dailyUsageCount: currentUsage + 1,
        lastUsageDate: Timestamp.now(),
      })
    })

    // 7. Stream response back to client
    return result.toAIStreamResponse()
  } catch (error: any) {
    console.error("Error in chat API:", error)
    if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
      return new Response("Unauthorized: Invalid auth token.", { status: 401 })
    }
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
