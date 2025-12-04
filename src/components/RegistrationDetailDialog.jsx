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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  Copy,
  Download,
  X,
  FileStack,
  Globe,
  Calendar,
  Link as LinkIcon,
  ListTree,
  FileText,
  Users,
  Info,
} from "lucide-react";

export default function RegistrationDetailDialog({
  open,
  onOpenChange,
  data,
  onCopy,
  onDownload,
}) {
  if (!data) return null;

  const reg = data.normalized;
  const raw = data.raw;
  const attrs = raw?.attributes || {};

  const schema = raw?.embeds?.registration_schema;
  const schemaBlocks = schema?.attributes?.schema || [];

  const answers = attrs?.registered_meta || {};

  const pretty = (o) => JSON.stringify(o, null, 2);

  // render schema section answer
  const renderFieldAnswer = (key, block) => {
    const answer = answers[key];
    if (!answer) return <div className="opacity-50">No answer</div>;

    if (typeof answer === "string") return <div>{answer}</div>;

    return (
      <pre className="text-xs p-2 border rounded bg-zinc-50 dark:bg-zinc-900 max-h-40 overflow-auto">
        {pretty(answer)}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 rounded-2xl overflow-hidden">
        
        {/* HEADER */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-semibold text-lg">
              <FileStack className="w-5 h-5 text-blue-500" />
              Registration: {reg.title || "Untitled Registration"}
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

        {/* BODY WITH TABS */}
        <Tabs defaultValue="overview" className="w-full">
          {/* TAB HEADER */}
          <TabsList className="w-full justify-start px-4 border-b bg-background/50 backdrop-blur">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="schema">Schema Answers</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT MAIN AREA */}
              <div className="lg:col-span-2 space-y-6">

                {/* Basic */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-blue-600/10 text-blue-600">
                      Registration
                    </Badge>

                    {attrs.category && (
                      <Badge className="bg-zinc-200/40 dark:bg-zinc-800">
                        {attrs.category}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs opacity-60">
                    ID: {reg.id}
                  </div>

                  <div className="mt-2 text-sm">{attrs.description}</div>
                </div>

                <Separator />

                {/* Times */}
                <div>
                  <div className="text-sm font-semibold mb-3">
                    Important Dates
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs opacity-60">Created</div>
                      <div>
                        {attrs.date_created
                          ? new Date(attrs.date_created).toLocaleString()
                          : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Registered</div>
                      <div>
                        {attrs.date_registered
                          ? new Date(attrs.date_registered).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contributors */}
                {raw?.embeds?.contributors?.data?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 opacity-70" />
                      Contributors
                    </div>

                    <div className="space-y-2">
                      {raw.embeds.contributors.data.map((c, i) => (
                        <div
                          key={i}
                          className="p-2 border rounded bg-zinc-50 dark:bg-zinc-900"
                        >
                          {c.attributes.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT METADATA PANEL */}
              <div className="space-y-6">

                {/* Links */}
                <div>
                  <div className="text-sm font-semibold mb-2">
                    Links
                  </div>

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
                  </div>
                </div>

                <Separator />

                {/* Registration Schema */}
                <div>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ListTree className="w-4 h-4 opacity-70" />
                    Registration Schema
                  </div>

                  <div className="text-xs opacity-60">
                    {schema?.attributes?.name || "—"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* METADATA TAB */}
          <TabsContent value="metadata">
            <div className="p-4 space-y-6">

              <div className="text-sm font-semibold">Metadata</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs opacity-60">Category</div>
                  <div>{attrs.category || "—"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Pending Approval</div>
                  <div>{attrs.pending_withdrawal ? "Yes" : "No"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Withdrawn</div>
                  <div>{attrs.withdrawn ? "Yes" : "No"}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Fork</div>
                  <div>{attrs.fork ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SCHEMA ANSWERS TAB */}
          <TabsContent value="schema">
            <div className="p-4 space-y-6">
              <div className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 opacity-70" />
                Registration Schema Answers
              </div>

              {schemaBlocks.length === 0 && (
                <div className="opacity-60 text-sm">No schema answers.</div>
              )}

              {/* schema blocks */}
              {schemaBlocks.map((block, index) => {
                const key = block?.page_heading;

                return (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900"
                  >
                    <div className="font-medium mb-1">
                      {block.page_heading}
                    </div>

                    <div className="text-xs opacity-60 mb-3">
                      {block.description}
                    </div>

                    <div className="space-y-4 text-sm">
                      {Object.keys(block.questions || {}).map((qkey, qindex) => {
                        const q = block.questions[qkey];
                        const fieldKey = q.qid || qkey;

                        return (
                          <div key={qindex}>
                            <div className="font-medium">{q.title}</div>
                            <div className="text-xs opacity-60 mb-1">
                              {q.help}
                            </div>

                            <div className="p-2 border rounded mt-1 bg-white dark:bg-zinc-800">
                              {renderFieldAnswer(fieldKey, q)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* RAW JSON TAB */}
          <TabsContent value="raw">
            <div className="p-4">
              <pre className="text-xs p-3 rounded-md border max-h-[600px] overflow-auto">
                {pretty(raw)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t">
          <div className="text-xs opacity-60 flex-1">
            Loaded from OSF Registration API
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
