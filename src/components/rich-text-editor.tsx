"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Eye,
  Edit,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your content here...",
  minHeight = "300px",
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Insert text at cursor position
  const insertAtCursor = (textToInsert: string, selectText = false) => {
    const textarea = document.getElementById(
      "rich-text-textarea"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value;

    const newValue =
      currentValue.substring(0, start) +
      textToInsert +
      currentValue.substring(end);

    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      if (selectText) {
        textarea.setSelectionRange(start, start + textToInsert.length);
      } else {
        textarea.setSelectionRange(
          start + textToInsert.length,
          start + textToInsert.length
        );
      }
      textarea.focus();
    }, 0);
  };

  // Wrap selected text with tags
  const wrapText = (startTag: string, endTag: string) => {
    const textarea = document.getElementById(
      "rich-text-textarea"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const wrappedText = startTag + selectedText + endTag;
      insertAtCursor(wrappedText, true);
    } else {
      const placeholder = `${startTag}text${endTag}`;
      insertAtCursor(placeholder, false);
    }
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => wrapText("<strong>", "</strong>"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => wrapText("<em>", "</em>"),
    },
    {
      icon: Underline,
      label: "Underline",
      action: () => wrapText("<u>", "</u>"),
    },
    {
      icon: Code,
      label: "Code",
      action: () => wrapText("<code>", "</code>"),
    },
    {
      icon: List,
      label: "Unordered List",
      action: () =>
        insertAtCursor("\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n"),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      action: () =>
        insertAtCursor("\n<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ol>\n"),
    },
    {
      icon: Link,
      label: "Link",
      action: () => wrapText('<a href="https://example.com">', "</a>"),
    },
    {
      icon: Image,
      label: "Image",
      action: () =>
        insertAtCursor(
          '<img src="https://example.com/image.jpg" alt="Description" />'
        ),
    },
  ];

  const insertTemplate = (template: string) => {
    insertAtCursor(template);
  };

  const templates = [
    {
      name: "Heading 2",
      template: "<h2>Heading</h2>\n",
    },
    {
      name: "Heading 3",
      template: "<h3>Heading</h3>\n",
    },
    {
      name: "Paragraph",
      template: "<p>Your paragraph content here.</p>\n",
    },
    {
      name: "Blockquote",
      template: "<blockquote>\n  <p>Your quote here.</p>\n</blockquote>\n",
    },
    {
      name: "Code Block",
      template: "<pre><code>\n// Your code here\n</code></pre>\n",
    },
  ];

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
      >
        <div className="flex items-center justify-between mb-2">
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

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              HTML Supported
            </Badge>
          </div>
        </div>

        <TabsContent value="edit" className="space-y-4">
          {/* Toolbar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Formatting Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Text Formatting */}
              <div className="flex flex-wrap gap-2">
                {toolbarButtons.map((button, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={button.action}
                    className="h-8 px-2"
                    title={button.label}
                  >
                    <button.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Quick Insert:
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => insertTemplate(template.template)}
                      className="h-8 text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
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
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: value }}
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
