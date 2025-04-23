"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface TaskInputProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export default function TaskInput({ value, onChange, onGenerate, isGenerating }: TaskInputProps) {
  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <Textarea
          placeholder="Describe the programming task that you want to be solved..."
          className="min-h-[200px] mb-4 resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={onGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
