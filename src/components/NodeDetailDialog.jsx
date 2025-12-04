"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  Copy,
  Download,
  X,
  Layers,
  Globe,
  Calendar,
  Link as LinkIcon,
  Tags,
  Lock,
  Unlock,
  Users,
  FileStack,
  GitPullRequest,
  FileText,
  Folder,
} from "lucide-react";

export default function NodeDetailDialog({
  open,
  onOpenChange,
  data,
  onCopy,
  onDownload,
}) {
  if (!data) return null;

  const n = data.normalized;
  const raw = data.raw;
  const attrs = raw?.attributes || {};

  const pretty = (o) => JSON.stringify(o, null, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 rounded-2xl overflow-hidden">
        
        {/* HEADER */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-semibold text-lg">
              <Layers className="w-5 h-5 text-purple-500" />
              {n.title || "Node"}
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

        {/* BODY */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT MAIN AREA */}
          <div className="lg:col-span-2 space-y-6">

            {/* BASIC HEADER */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {attrs.public ? (
                  <Badge className="bg-green-600/10 text-green-600 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge className="bg-red-600/10 text-red-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Private
                  </Badge>
                )}

                {attrs.category && (
                  <Badge className="bg-zinc-200/40 dark:bg-zinc-800">
                    {attrs.category}
                  </Badge>
                )}
              </div>

              <div className="text-xs opacity-60">
                Node ID: {n.id}
              </div>
            </div>

            <Separator />

            {/* OVERVIEW */}
            <div>
              <div className="text-sm font-semibold mb-3">Overview</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs opacity-60">Title</div>
                  <div>{attrs.title || "—"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Created</div>
                  <div>
                    {attrs.date_created
                      ? new Date(attrs.date_created).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Modified</div>
                  <div>
                    {attrs.date_modified
                      ? new Date(attrs.date_modified).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Fork?</div>
                  <div>{attrs.fork ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            {/* TAGS */}
            {attrs.tags?.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Tags className="w-4 h-4 opacity-70" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attrs.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        className="bg-purple-600/10 text-purple-700"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CONTRIBUTORS PREVIEW */}
            {raw?.embeds?.contributors?.data?.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-70" />
                    Contributors
                  </div>

                  <div classname="space-y-2">
                    {raw.embeds.contributors.data.map((c, i) => (
                      <div
                        key={i}
                        className="p-2 border rounded-md bg-zinc-50 dark:bg-zinc-900"
                      >
                        {c.attributes.full_name}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT METADATA PANEL */}
          <div className="space-y-6">

            {/* LINKS */}
            <div>
              <div className="text-sm font-semibold mb-2">Links</div>

              <div className="space-y-2 text-sm">

                <a
                  href={raw?.links?.html}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sky-500"
                >
                  <Globe className="w-4 h-4" />
                  View on OSF
                </a>

                <a
                  href={raw?.links?.self}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sky-500"
                >
                  <LinkIcon className="w-4 h-4" />
                  API Endpoint
                </a>

                <div className="flex items-center gap-2 opacity-60">
                  <Folder className="w-4 h-4" />
                  Files
                </div>

                <div className="flex items-center gap-2 opacity-60">
                  <FileText className="w-4 h-4" />
                  Wikis
                </div>

                <div className="flex items-center gap-2 opacity-60">
                  <GitPullRequest className="w-4 h-4" />
                  Registrations
                </div>

                <div className="flex items-center gap-2 opacity-60">
                  <FileStack className="w-4 h-4" />
                  Preprints
                </div>
              </div>
            </div>

            <Separator />

            {/* RAW JSON */}
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
            Loaded from OSF Node API
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
