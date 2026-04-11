"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ClientAuthUtils } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Upload,
  Database,
  Shield,
  FileJson,
  FolderArchive,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

interface RestoreResult {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
}

interface SeedResult {
  iconsExtracted: number;
  iconsSkipped: number;
  iconsUpdated: number;
  orphansRemoved: number;
  categoryIconsExtracted: number;
  categoryIconsSkipped: number;
  categoryIconsUpdated: number;
  groupIconsExtracted: number;
  servicesCreated: number;
  servicesSkipped: number;
}

export function AdminPanel() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<number | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
    null
  );
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [seedFile, setSeedFile] = useState<File | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const seedInputRef = useRef<HTMLInputElement>(null);

  const [clearLoading, setClearLoading] = useState(false);
  const [clearResult, setClearResult] = useState<number | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be logged in as an administrator to access this page.
        </p>
      </div>
    );
  }

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupError(null);
    try {
      const res = await fetch("/api/admin/backup", {
        headers: ClientAuthUtils.getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Backup failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      a.download = match?.[1] || `cloudcanvas-backup.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : "Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRestoreResult(null);
    setRestoreError(null);
    const file = e.target.files?.[0] ?? null;
    setRestoreFile(file);
    if (!file) {
      setRestorePreview(null);
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setRestorePreview(parsed.services?.length ?? 0);
    } catch {
      setRestorePreview(null);
      setRestoreError("Could not parse the selected file as valid backup JSON");
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreResult(null);
    try {
      const text = await restoreFile.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ClientAuthUtils.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Restore failed");
      setRestoreResult(result.data);
      setRestoreFile(null);
      setRestorePreview(null);
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleSeedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeedResult(null);
    setSeedError(null);
    setSeedFile(e.target.files?.[0] ?? null);
  };

  const handleSeed = async () => {
    if (!seedFile) return;
    setSeedLoading(true);
    setSeedError(null);
    setSeedResult(null);
    try {
      const formData = new FormData();
      formData.append("file", seedFile);
      const res = await fetch("/api/admin/seed-icons", {
        method: "POST",
        headers: ClientAuthUtils.getAuthHeaders(),
        body: formData,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Seed failed");
      setSeedResult(result.data);
      setSeedFile(null);
      if (seedInputRef.current) seedInputRef.current.value = "";
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClear = async () => {
    setClearLoading(true);
    setClearError(null);
    setClearResult(null);
    try {
      const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: ClientAuthUtils.getAuthHeaders(),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Clear failed");
      setClearResult(result.data.deleted);
    } catch (err) {
      setClearError(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage service data backups, restoration, and icon seeding.
        </p>
      </div>

      <Separator />

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download all service records as a single JSON file. This can later be
            used to restore the database to its current state.
          </p>
          <Button onClick={handleBackup} disabled={backupLoading}>
            {backupLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="mr-2 h-4 w-4" />
            )}
            Download Backup
          </Button>
          {backupError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <XCircle className="h-4 w-4" /> {backupError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore from Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a previously downloaded backup JSON. The system will create
            missing records, update changed ones, delete removed ones, and skip
            identical entries.
          </p>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFileChange}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
          {restorePreview !== null && (
            <p className="text-sm text-muted-foreground">
              Backup contains{" "}
              <Badge variant="secondary">{restorePreview}</Badge> services.
            </p>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!restoreFile || restoreLoading || restorePreview === null}
              >
                {restoreLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Restore from Backup
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm Restore
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will synchronise the database with the backup file. Records
                  not present in the backup will be deleted. This action cannot be
                  easily undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestore}>
                  Yes, Restore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {restoreResult && (
            <div className="rounded-md border p-4 space-y-2 bg-muted/40">
              <p className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Restore
                Complete
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>
                  Created:{" "}
                  <Badge variant="secondary">{restoreResult.created}</Badge>
                </span>
                <span>
                  Updated:{" "}
                  <Badge variant="secondary">{restoreResult.updated}</Badge>
                </span>
                <span>
                  Deleted:{" "}
                  <Badge variant="secondary">{restoreResult.deleted}</Badge>
                </span>
                <span>
                  Skipped:{" "}
                  <Badge variant="secondary">{restoreResult.skipped}</Badge>
                </span>
              </div>
            </div>
          )}
          {restoreError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <XCircle className="h-4 w-4" /> {restoreError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clear Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Clear Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete all service records from the database. Use this to start fresh
            before re-seeding from an icons zip. This does not remove icon files
            from disk.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={clearLoading}>
                {clearLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Clear All Services
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Clear Entire Database?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete every service record in the
                  database. Make sure you have a backup first. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClear}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {clearResult !== null && (
            <div className="rounded-md border p-4 space-y-2 bg-muted/40">
              <p className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Clear
                Complete
              </p>
              <p className="text-sm">
                Deleted{" "}
                <Badge variant="secondary">{clearResult}</Badge> services.
              </p>
            </div>
          )}
          {clearError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <XCircle className="h-4 w-4" /> {clearError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seed from Icons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderArchive className="h-5 w-5" />
            Seed Services from Icons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload the AWS Architecture Icons zip package. The system will extract
            64px Architecture-Service SVGs, write them to the public directory,
            create database records for new services, and clean up orphaned icons.
          </p>
          <input
            ref={seedInputRef}
            type="file"
            accept=".zip"
            onChange={handleSeedFileChange}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!seedFile || seedLoading}>
                {seedLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FolderArchive className="mr-2 h-4 w-4" />
                )}
                Seed Services from Icons
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm Seed
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will extract icons into the public directory, create
                  database records for new services, and remove orphaned icon
                  files. Existing service records will not be overwritten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed}>
                  Yes, Seed
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {seedResult && (
            <div className="rounded-md border p-4 space-y-2 bg-muted/40">
              <p className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Seed Complete
              </p>
              <div className="space-y-3 text-sm">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  Service Icons
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <span>
                    Extracted:{" "}
                    <Badge variant="secondary">{seedResult.iconsExtracted}</Badge>
                  </span>
                  <span>
                    Updated:{" "}
                    <Badge variant="secondary">{seedResult.iconsUpdated}</Badge>
                  </span>
                  <span>
                    Skipped:{" "}
                    <Badge variant="secondary">{seedResult.iconsSkipped}</Badge>
                  </span>
                  <span>
                    Orphans removed:{" "}
                    <Badge variant="secondary">{seedResult.orphansRemoved}</Badge>
                  </span>
                </div>
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  Category Icons
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <span>
                    Extracted:{" "}
                    <Badge variant="secondary">
                      {seedResult.categoryIconsExtracted}
                    </Badge>
                  </span>
                  <span>
                    Updated:{" "}
                    <Badge variant="secondary">
                      {seedResult.categoryIconsUpdated}
                    </Badge>
                  </span>
                  <span>
                    Skipped:{" "}
                    <Badge variant="secondary">
                      {seedResult.categoryIconsSkipped}
                    </Badge>
                  </span>
                  <span>
                    Group icons:{" "}
                    <Badge variant="secondary">
                      {seedResult.groupIconsExtracted}
                    </Badge>
                  </span>
                </div>
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  Database Records
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <span>
                    Created:{" "}
                    <Badge variant="secondary">{seedResult.servicesCreated}</Badge>
                  </span>
                  <span>
                    Skipped:{" "}
                    <Badge variant="secondary">{seedResult.servicesSkipped}</Badge>
                  </span>
                </div>
              </div>
            </div>
          )}
          {seedError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <XCircle className="h-4 w-4" /> {seedError}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
