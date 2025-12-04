// src/components/osf/UserDetailDialog.jsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  X,
  User,
  Mail,
  Globe,
  Calendar,
  Link as LinkIcon,
  GitPullRequest,
  FileStack,
  Layers,
  Building2,
} from "lucide-react";

export default function UserDetailDialog({
  open,
  onOpenChange,
  data,
  onCopy,
  onDownload
}) {
  if (!data) return null;

  const profile = data.normalized;
  const raw = data.raw || {};

  const pretty = (o) => JSON.stringify(o, null, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 rounded-2xl overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-semibold text-lg">
              <User className="w-5 h-5 text-sky-500" />
              {profile.fullname}
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onCopy}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={onDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENT */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Avatar + Basic */}
            <div className="flex items-start gap-4">
              <img
                src={raw?.links?.profile_image}
                alt="avatar"
                className="w-20 h-20 rounded-lg border object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-lg">{profile.fullname}</div>
                <div className="text-xs opacity-60">User ID: {profile.id}</div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="bg-sky-600/10 text-sky-700">
                    Active User
                  </Badge>

                  {profile.locale && (
                    <Badge className="bg-zinc-200/40 dark:bg-zinc-800">
                      {profile.locale}
                    </Badge>
                  )}

                  {profile.timezone && (
                    <Badge className="bg-zinc-200/40 dark:bg-zinc-800">
                      {profile.timezone}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">Basic Information</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs opacity-60">First name</div>
                  <div>{profile.given_name || "—"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Last name</div>
                  <div>{profile.family_name || "—"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Date Registered</div>
                  <div>
                    {raw?.attributes?.date_registered
                      ? new Date(
                          raw.attributes.date_registered
                        ).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Active</div>
                  <div>{raw?.attributes?.active ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            {/* Employment */}
            {raw?.attributes?.employment?.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="font-semibold text-sm mb-2">
                    Employment
                  </div>
                  <div className="space-y-2 text-sm">
                    {raw.attributes.employment.map((job, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-md bg-zinc-50 dark:bg-zinc-900"
                      >
                        <div>{job.institution}</div>
                        <div className="text-xs opacity-60">
                          {job.start_year} - {job.end_year || "Present"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Education */}
            {raw?.attributes?.education?.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="font-semibold text-sm mb-2">
                    Education
                  </div>
                  <div className="space-y-2 text-sm">
                    {raw.attributes.education.map((edu, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-md bg-zinc-50 dark:bg-zinc-900"
                      >
                        <div>{edu.institution}</div>
                        <div className="text-xs opacity-60">
                          {edu.start_year} - {edu.end_year || "Present"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT METADATA PANEL */}
          <div className="space-y-6">
            
            <div>
              <div className="text-sm font-semibold mb-2">Links</div>
              <div className="space-y-2 text-sm">
                <a
                  href={raw?.links?.html}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sky-500"
                >
                  <Globe className="w-4 h-4" /> OSF Profile
                </a>

                <a
                  href={raw?.links?.self}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sky-500"
                >
                  <LinkIcon className="w-4 h-4" /> API Endpoint
                </a>
              </div>
            </div>

            <Separator />

            {/* Relationships */}
            <div>
              <div className="text-sm font-semibold mb-2">Relationships</div>

              <div className="text-xs opacity-60 mb-2">
                (Click inside main page to load them)
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 opacity-70" />
                  Nodes
                </div>
                <div className="flex items-center gap-2">
                  <FileStack className="w-4 h-4 opacity-70" />
                  Registrations
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 opacity-70" />
                  Institutions
                </div>
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 opacity-70" />
                  Preprints
                </div>
              </div>
            </div>

            <Separator />

            {/* Raw JSON */}
            <div>
              <div className="text-sm font-semibold mb-2">Raw JSON</div>
              <pre className="text-xs p-3 rounded-md border max-h-64 overflow-auto">
                {pretty(raw)}
              </pre>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t">
          <div className="text-xs opacity-60 flex-1">
            Loaded from OSF User API
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
