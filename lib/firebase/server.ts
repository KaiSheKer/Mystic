import * as admin from "firebase-admin"

// Decode the Base64 encoded service account key
const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SDK_BASE64
if (!serviceAccountBase64) {
  throw new Error("FIREBASE_ADMIN_SDK_BASE64 environment variable is not set.")
}

const serviceAccountJson = Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
const serviceAccount = JSON.parse(serviceAccountJson)

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
