import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { MountainIcon } from "lucide-react"
import FirebaseAuthButton from "@/components/auth/firebase-auth-button" // Updated import
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mystic Guide - Your Divination Portal",
  description: "Explore BaZi, Natal Charts, Tarot, and Daily Horoscopes.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <MountainIcon className="h-6 w-6" />
                <span className="sr-only">Mystic Guide</span>
                <span className="font-semibold">Mystic Guide</span>
              </Link>
              <Suspense fallback={<div>Loading...</div>}>
                <FirebaseAuthButton />
              </Suspense>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mystic Guide. All rights reserved.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
