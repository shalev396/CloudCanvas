"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { ServiceCard } from "@/components/service-card";
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
  FileText,
} from "lucide-react";
import { AwsService, CategoryConfig } from "@/lib/types";
import { marked } from "marked";

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
  const [relatedServices, setRelatedServices] = useState<AwsService[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [editData, setEditData] = useState({
    name: service.name || "",
    summary: service.summary || "",
    description: service.description || "",
    htmlContent: service.htmlContent || "",
    awsDocsUrl: service.awsDocsUrl || "",
    diagramUrl: service.diagramUrl || "",
    enabled: service.enabled ?? true,
  });
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isAdmin = isAuthenticated && user?.isAdmin;

  // Convert markdown to HTML for rendering
  const renderMarkdown = (markdown: string | null | undefined) => {
    if (!markdown || !markdown.trim()) return "";
    try {
      // In marked v16+, use marked.parse() with options
      return marked.parse(markdown, {
        breaks: true, // Enable line breaks
        gfm: true, // GitHub flavored markdown
      });
    } catch (error) {
      console.error("Markdown rendering error:", error);
      return `<p>Error rendering markdown</p>`;
    }
  };

  // Fetch related services from the same category
  useEffect(() => {
    const fetchRelatedServices = async () => {
      try {
        setLoadingRelated(true);
        const response = await fetch(
          `/api/services?category=${initialService.category}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch related services");
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Filter out the current service and sort alphabetically
          const filteredServices = result.data
            .filter((s: AwsService) => s.id !== initialService.id)
            .sort((a: AwsService, b: AwsService) =>
              a.name.localeCompare(b.name)
            );
          setRelatedServices(filteredServices);
        }
      } catch (error) {
        console.error("Error fetching related services:", error);
        setRelatedServices([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedServices();
  }, [initialService.category, initialService.id]);

  // Memoize related services grid to prevent unnecessary re-renders
  const relatedServicesGrid = useMemo(() => {
    if (loadingRelated) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    if (relatedServices.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No other services found in the {categoryInfo.displayName} category.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Other services in the {categoryInfo.displayName} category:
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
          {relatedServices.map((relatedService) => (
            <React.Fragment key={relatedService.id}>
              {/* Mobile: Small size (33% bigger than tiny) */}
              <div className="md:hidden">
                <ServiceCard service={relatedService} size="small" />
              </div>
              {/* Desktop: Medium size (quite a bit larger) */}
              <div className="hidden md:block">
                <ServiceCard service={relatedService} size="medium" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }, [relatedServices, loadingRelated, categoryInfo.displayName]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: service.name || "",
      summary: service.summary || "",
      description: service.description || "",
      htmlContent: service.htmlContent || "",
      awsDocsUrl: service.awsDocsUrl || "",
      diagramUrl: service.diagramUrl || "",
      enabled: service.enabled ?? true,
    });
    setSaveMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: service.name || "",
      summary: service.summary || "",
      description: service.description || "",
      htmlContent: service.htmlContent || "",
      awsDocsUrl: service.awsDocsUrl || "",
      diagramUrl: service.diagramUrl || "",
      enabled: service.enabled ?? true,
    });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/services/id/${service.id}`, {
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
      <div className="container mx-auto px-4 py-8">
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
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Service Icon - Centered */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={service.iconPath}
                  alt={service.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Service Name */}
            <div className="text-center">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="service-name-mobile">Service Name</Label>
                  <Input
                    id="service-name-mobile"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="text-xl font-bold text-center"
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-foreground">
                  {service.name}
                </h1>
              )}
            </div>

            {/* Category Badge - Centered */}
            <div className="flex justify-center items-center gap-2">
              <div className="relative w-5 h-5">
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

            {/* Service Description */}
            <div className="text-center">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="service-summary-mobile">Summary</Label>
                  <Textarea
                    id="service-summary-mobile"
                    value={editData.summary}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    rows={2}
                    className="text-base"
                  />
                </div>
              ) : (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {service.summary}
                </p>
              )}
            </div>

            {/* Action Buttons - Centered */}
            <div className="flex justify-center items-center gap-3">
              {service.awsDocsUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  asChild
                >
                  <a
                    href={service.awsDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    AWS
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  disabled
                >
                  <ExternalLink className="h-3 w-3" />
                  AWS
                </Button>
              )}

              {isAdmin && (
                <>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="gap-1 text-xs"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleEdit}
                      variant="default"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Mobile editing fields */}
            {isEditing && (
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="aws-docs-url-mobile">
                    AWS Documentation URL
                  </Label>
                  <Input
                    id="aws-docs-url-mobile"
                    type="url"
                    value={editData.awsDocsUrl}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        awsDocsUrl: e.target.value,
                      }))
                    }
                    placeholder="https://docs.aws.amazon.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagram-url-mobile">
                    Draw.io Diagram URL
                  </Label>
                  <Input
                    id="diagram-url-mobile"
                    type="url"
                    value={editData.diagramUrl}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        diagramUrl: e.target.value,
                      }))
                    }
                    placeholder="https://viewer.diagrams.net/?url=..."
                  />
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <Switch
                    id="service-enabled-mobile"
                    checked={editData.enabled}
                    onCheckedChange={(checked) =>
                      setEditData((prev) => ({
                        ...prev,
                        enabled: checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="service-enabled-mobile"
                    className="text-sm font-medium"
                  >
                    Service Enabled
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-start gap-6 mb-6">
              {/* Desktop: Service Icon */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={service.iconPath}
                  alt={service.name}
                  fill
                  className="object-contain"
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
                      <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        {service.name}
                      </h1>
                    )}

                    {/* Editable Service Summary */}
                    {isEditing ? (
                      <div className="space-y-4">
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

                        <div className="space-y-2">
                          <Label htmlFor="aws-docs-url">
                            AWS Documentation URL
                          </Label>
                          <Input
                            id="aws-docs-url"
                            type="url"
                            value={editData.awsDocsUrl}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                awsDocsUrl: e.target.value,
                              }))
                            }
                            placeholder="https://docs.aws.amazon.com/..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="diagram-url">
                            Draw.io Diagram URL
                          </Label>
                          <Input
                            id="diagram-url"
                            type="url"
                            value={editData.diagramUrl}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                diagramUrl: e.target.value,
                              }))
                            }
                            placeholder="https://viewer.diagrams.net/?url=..."
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="service-enabled"
                            checked={editData.enabled}
                            onCheckedChange={(checked) =>
                              setEditData((prev) => ({
                                ...prev,
                                enabled: checked,
                              }))
                            }
                          />
                          <Label
                            htmlFor="service-enabled"
                            className="text-sm font-medium"
                          >
                            Service Enabled
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg lg:text-xl text-muted-foreground">
                        {service.summary}
                      </p>
                    )}
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="flex items-center gap-2">
                    {service.awsDocsUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <a
                          href={service.awsDocsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          AWS Docs
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled
                      >
                        <ExternalLink className="h-4 w-4" />
                        AWS Docs
                      </Button>
                    )}

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

          {/* Architecture Diagrams Card */}
          <Card className="border-l-4 border-l-amber-500 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-amber-500 font-semibold text-sm">
                    📊
                  </span>
                </div>
                Architecture Diagrams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.diagramUrl ? (
                <div className="space-y-4">
                  <div className="w-full bg-white rounded-lg overflow-hidden border">
                    <iframe
                      src={service.diagramUrl}
                      title={`${service.name} Architecture Diagram`}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      className="w-full"
                      sandbox="allow-scripts allow-same-origin"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Interactive architecture diagram powered by Draw.io
                    </span>
                    <a
                      href={service.diagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold mb-2">Architecture Diagram</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    No diagram available for {service.name} yet.
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Admin: Add a Draw.io diagram URL in edit mode to display
                      an interactive diagram here.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="border-l-4 border-l-blue-500 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              {isEditing ? (
                <div className="p-6">
                  <RichTextEditor
                    value={editData.htmlContent}
                    onChange={(value) =>
                      setEditData((prev) => ({ ...prev, htmlContent: value }))
                    }
                    placeholder="Enter detailed notes with markdown formatting..."
                  />
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold">Notes</h3>
                  </div>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none lg:prose-lg"
                    dangerouslySetInnerHTML={{
                      __html:
                        renderMarkdown(service.htmlContent) ||
                        "<p class='text-muted-foreground'>No additional notes available.</p>",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Services */}
          <Card className="border-l-4 border-l-purple-500 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-semibold text-sm">
                    🔗
                  </span>
                </div>
                Related Services
                {relatedServices.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {relatedServices.length} services
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>{relatedServicesGrid}</CardContent>
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
