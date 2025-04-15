import { getMockupById } from "@/app/actions/mockup-actions"
import { WindowMockupGenerator } from "@/components/window-mockup-generator"
import { notFound } from "next/navigation"

export default async function MockupPage({ params }: { params: { id: string } }) {
  const { success, mockup, error } = await getMockupById(params.id)

  if (!success || !mockup) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">{mockup.title}</h1>
        <WindowMockupGenerator
          initialMarkup={mockup.markup}
          initialTitle={mockup.title}
          initialDocumentation={mockup.documentation || ""}
          mockupId={mockup.id}
          readOnly={false}
        />
      </div>
    </main>
  )
}
