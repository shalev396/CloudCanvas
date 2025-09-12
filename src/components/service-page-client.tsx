"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useAuth } from "@/contexts/auth-context";
import { ClientAuthUtils } from "@/lib/auth-client";
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { AwsService, CategoryConfig } from "@/lib/types";

interface ServicePageClientProps {
  service: AwsService;
  categoryInfo: CategoryConfig;
}

export function ServicePageClient({
  service: initialService,
  categoryInfo,
}: ServicePageClientProps) {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [service, setService] = useState(initialService);
  const [editData, setEditData] = useState({
    name: service.name,
    summary: service.summary,
    description: service.description,
    htmlContent: service.htmlContent || "",
    enabled: service.enabled,
  });
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isAdmin = isAuthenticated && user?.isAdmin;

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: service.name,
      summary: service.summary,
      description: service.description,
      htmlContent: service.htmlContent || "",
      enabled: service.enabled,
    });
    setSaveMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: service.name,
      summary: service.summary,
      description: service.description,
      htmlContent: service.htmlContent || "",
      enabled: service.enabled,
    });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/services/${service.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...ClientAuthUtils.getAuthHeaders(),
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setService(result.data);
        setIsEditing(false);
        setSaveMessage({
          type: "success",
          message: "Service updated successfully!",
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({
          type: "error",
          message: result.error || "Failed to save changes",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage({ type: "error", message: "Network error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>

        {/* Success/Error Messages */}
        {saveMessage && (
          <Alert
            className={`mb-6 ${
              saveMessage.type === "success"
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                saveMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {saveMessage.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Service Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            {/* Service Icon */}
            <div className="relative w-24 h-24 flex-shrink-0 bg-white rounded-lg p-4 border shadow-sm">
              <Image
                src={service.iconPath}
                alt={service.name}
                fill
                className="object-contain p-2"
              />
            </div>

            {/* Service Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative w-6 h-6">
                      <Image
                        src={categoryInfo.iconPath}
                        alt={categoryInfo.displayName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categoryInfo.displayName}
                    </Badge>
                  </div>

                  {/* Editable Service Name */}
                  {isEditing ? (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="service-name">Service Name</Label>
                      <Input
                        id="service-name"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="text-2xl font-bold"
                      />
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {service.name}
                    </h1>
                  )}

                  {/* Editable Service Summary */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="service-summary">Summary</Label>
                      <Textarea
                        id="service-summary"
                        value={editData.summary}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                        rows={2}
                        className="text-lg"
                      />
                    </div>
                  ) : (
                    <p className="text-xl text-muted-foreground">
                      {service.summary}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    AWS Docs
                  </Button>

                  {isAdmin && (
                    <>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            size="sm"
                            className="gap-2"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save
                          </Button>
                          <Button
                            onClick={handleCancel}
                            disabled={isSaving}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleEdit}
                          variant="default"
                          size="sm"
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Notebook-Style Content */}
        <div className="space-y-8">
          {/* Service Description Card */}
          <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">📖</span>
                </div>
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea
                    id="service-description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed">
                    {service.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* HTML Content Card */}
          <Card className="border-l-4 border-l-blue-500 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-semibold text-sm">
                    📚
                  </span>
                </div>
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label>Rich Content (HTML supported)</Label>
                  <RichTextEditor
                    value={editData.htmlContent}
                    onChange={(value) =>
                      setEditData((prev) => ({ ...prev, htmlContent: value }))
                    }
                    placeholder="Enter detailed documentation with HTML formatting..."
                  />
                </div>
              ) : (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      service.htmlContent ||
                      "<p>No additional documentation available.</p>",
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Service Information Card */}
          <Card className="border-l-4 border-l-green-500 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 font-semibold text-sm">
                    ℹ️
                  </span>
                </div>
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">
                    Category
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5">
                      <Image
                        src={categoryInfo.iconPath}
                        alt={categoryInfo.displayName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-muted-foreground">
                      {categoryInfo.displayName}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">
                    Service ID
                  </h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                    {service.id}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">
                    Last Updated
                  </h4>
                  <span className="text-muted-foreground">
                    {new Date(service.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Status</h4>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="service-enabled"
                        checked={editData.enabled}
                        onCheckedChange={(checked) =>
                          setEditData((prev) => ({ ...prev, enabled: checked }))
                        }
                      />
                      <Label htmlFor="service-enabled">
                        {editData.enabled ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  ) : (
                    <Badge variant={service.enabled ? "default" : "secondary"}>
                      {service.enabled ? "Active" : "Disabled"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Services (placeholder for future implementation) */}
          <Card className="border-l-4 border-l-purple-500 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-semibold text-sm">
                    🔗
                  </span>
                </div>
                Related Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Related services in the {categoryInfo.displayName} category will
                be shown here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back to Top */}
        <div className="flex justify-center mt-12">
          <Button variant="ghost" asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
