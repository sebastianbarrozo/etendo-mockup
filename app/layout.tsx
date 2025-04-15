import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { MockupModalProvider } from "@/contexts/mockup-modal-context"
import { StorageSetup } from "@/components/storage-setup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Etendo-Style Window Mockup Generator",
  description: "Create mockups of Etendo-style windows with a simple markup language",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MockupModalProvider>
          <StorageSetup />
          {children}
          <Toaster />
        </MockupModalProvider>
      </body>
    </html>
  )
}


import './globals.css'
