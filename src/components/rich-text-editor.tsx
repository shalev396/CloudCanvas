"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { marked } from "marked";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your markdown content here...\n\n# Heading 1\n## Heading 2\n### Heading 3\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2\n\n[Link text](https://example.com)",
  minHeight = "300px",
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const isMobile = useIsMobile();

  // Convert markdown to HTML for preview
  const renderMarkdown = (markdown: string) => {
    if (!markdown.trim()) return "";
    try {
      // In marked v16+, use marked.parse() with options
      const html = marked.parse(markdown, {
        breaks: true, // Enable line breaks
        gfm: true, // GitHub flavored markdown
      });
      return html;
    } catch (error) {
      console.error("Markdown rendering error:", error);
      return `<p>Error rendering markdown</p>`;
    }
  };

  // For larger screens, show side-by-side view instead of tabs
  const showSideBySide = !isMobile;

  if (showSideBySide) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          <Badge variant="outline" className="text-xs">
            Markdown Supported
          </Badge>
        </div>

        <div
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
          style={{ minHeight }}
        >
          {/* Edit Panel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Edit className="h-4 w-4" />
              Edit
            </div>
            <Textarea
              id="rich-text-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="font-mono text-sm resize-none"
              style={{ minHeight: `calc(${minHeight} - 40px)` }}
            />
          </div>

          {/* Preview Panel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" />
              Preview
            </div>
            <Card style={{ minHeight: `calc(${minHeight} - 40px)` }}>
              <CardContent className="p-3 xl:p-4 h-full overflow-auto">
                {value ? (
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none prose-sm"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                  />
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    No content to preview. Start typing in the editor to see the
                    markdown rendered.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Mobile view with tabs
  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <Badge variant="outline" className="text-xs">
            Markdown Supported
          </Badge>
        </div>

        <TabsContent value="edit">
          <Textarea
            id="rich-text-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm"
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card style={{ minHeight }}>
            <CardContent className="p-6">
              {value ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none lg:prose-lg"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                />
              ) : (
                <p className="text-muted-foreground italic">
                  No content to preview. Switch to Edit tab to add content.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
