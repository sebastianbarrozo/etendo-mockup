import { WindowMockupGenerator } from "@/components/window-mockup-generator"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Etendo-Style Window Mockup Generator</h1>
        <WindowMockupGenerator readOnly={false} />
      </div>
    </main>
  )
}
