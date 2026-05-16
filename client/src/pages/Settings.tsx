import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, ClipboardPaste, Upload } from "lucide-react";

// ─── API Key Integrations ─────────────────────────────────────────────────────

type ApiService = "fireflies" | "notion" | "otter" | "granola" | "zoom" | "teams";

const API_SERVICE_INFO: Record<ApiService, {
  name: string;
  description: string;
  placeholder: string;
  docsUrl: string;
  howTo: string;
}> = {
  fireflies: {
    name: "Fireflies.ai",
    description: "Import meeting transcripts directly from your Fireflies account.",
    placeholder: "Enter your Fireflies API key",
    docsUrl: "https://app.fireflies.ai/integrations/custom/fireflies",
    howTo: "Go to Fireflies → Integrations → API → copy your API key",
  },
  notion: {
    name: "Notion",
    description: "Import notes and pages from your Notion workspace by pasting a page URL.",
    placeholder: "Enter your Notion integration token",
    docsUrl: "https://www.notion.so/my-integrations",
    howTo: "Go to notion.so/my-integrations → New integration → copy the Internal Integration Token",
  },
  otter: {
    name: "Otter.ai",
    description: "Import transcripts from your Otter.ai account.",
    placeholder: "Enter your Otter.ai API key",
    docsUrl: "https://otter.ai/developers",
    howTo: "Go to otter.ai/developers → API Keys → generate a new key",
  },
  granola: {
    name: "Granola",
    description: "Import AI-enhanced meeting notes directly from Granola.",
    placeholder: "Enter your Granola personal API key",
    docsUrl: "https://app.granola.ai/settings/api",
    howTo: "Open Granola → Settings → API Keys → create a new personal API key",
  },
  zoom: {
    name: "Zoom",
    description: "Import transcripts from your Zoom cloud recordings.",
    placeholder: "Enter your Zoom OAuth access token",
    docsUrl: "https://marketplace.zoom.us/develop/create",
    howTo: "Create a Server-to-Server OAuth app in Zoom Marketplace → generate an access token with cloud_recording:read scope",
  },
  teams: {
    name: "Microsoft Teams",
    description: "Import transcripts from your Microsoft Teams meetings via Graph API.",
    placeholder: "Enter your Microsoft Graph API access token",
    docsUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    howTo: "Register an app in Azure AD → grant OnlineMeetingTranscript.Read.All permission → generate an access token",
  },
};

function IntegrationCard({ service, connected, masked }: {
  service: ApiService;
  connected: boolean;
  masked: string | null;
}) {
  const utils = trpc.useUtils();
  const [inputKey, setInputKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const info = API_SERVICE_INFO[service];

  const setKey = trpc.integrations.setKey.useMutation({
    onSuccess: () => {
      toast.success(`${info.name} connected — your API key has been saved.`);
      setInputKey("");
      setShowInput(false);
      utils.integrations.getKeys.invalidate();
    },
    onError: (err) => toast.error(`Failed to save key: ${err.message}`),
  });

  const clearKey = trpc.integrations.clearKey.useMutation({
    onSuccess: () => {
      toast.success(`${info.name} disconnected — your API key has been removed.`);
      utils.integrations.getKeys.invalidate();
    },
    onError: (err) => toast.error(`Failed to disconnect: ${err.message}`),
  });

  const handleSave = () => {
    if (!inputKey.trim()) return;
    setKey.mutate({ service, apiKey: inputKey.trim() });
  };

  return (
    <Card className="border border-border bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold">{info.name}</CardTitle>
              {connected ? (
                <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs gap-1">
                  <XCircle className="w-3 h-3" /> Not connected
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1 text-sm">{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {connected && masked && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm font-mono text-muted-foreground">
            <span className="flex-1 truncate">{showKey ? masked : "••••••••••••" + masked.slice(-4)}</span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        {!connected && !showInput && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{info.howTo}</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => setShowInput(true)}>
                Connect {info.name}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={info.docsUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                  Get API key <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {showInput && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={info.placeholder}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="flex-1 text-sm font-mono"
                autoFocus
              />
              <Button size="sm" onClick={handleSave} disabled={!inputKey.trim() || setKey.isPending}>
                {setKey.isPending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowInput(false); setInputKey(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {connected && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowInput(!showInput)}>
              {showInput ? "Cancel" : "Update key"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => clearKey.mutate({ service })}
              disabled={clearKey.isPending}
            >
              {clearKey.isPending ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        )}

        {connected && showInput && (
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={info.placeholder}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="flex-1 text-sm font-mono"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={!inputKey.trim() || setKey.isPending}>
              {setKey.isPending ? "Saving…" : "Update"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Paste / Upload Integrations (no API) ────────────────────────────────────

type PasteService = { name: string; description: string; icon: "paste" | "upload"; instructions: string[] };

const PASTE_SERVICES: PasteService[] = [
  {
    name: "Rev.com",
    description: "Import human-transcribed content from Rev.",
    icon: "paste",
    instructions: [
      "Open your completed transcript in Rev",
      "Click the transcript to view the full text",
      'Select all (Ctrl+A / Cmd+A) and copy',
      'On New Session, tap "Paste from App" and paste your transcript',
    ],
  },
  {
    name: "Google Meet",
    description: "Import meeting transcripts from Google Meet.",
    icon: "paste",
    instructions: [
      "After your meeting, open Google Drive",
      "Find the auto-generated transcript Doc (named after your meeting)",
      "Open it, select all text, and copy",
      'On New Session, tap "Paste from App" and paste your transcript',
    ],
  },
  {
    name: "Fyxer",
    description: "Import meeting notes generated by Fyxer.",
    icon: "paste",
    instructions: [
      "Open Fyxer and find your meeting notes",
      "Copy the notes text",
      'On New Session, tap "Paste from App" and paste your notes into Personal Notes',
    ],
  },
];

function PasteServiceCard({ service }: { service: PasteService }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = service.icon === "paste" ? ClipboardPaste : Upload;

  return (
    <Card className="border border-border bg-card text-card-foreground">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
              <CardDescription className="text-sm">{service.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">Paste flow</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "Hide instructions" : "How to import →"}
        </button>
        {expanded && (
          <ol className="mt-3 space-y-1.5 list-decimal list-inside">
            {service.instructions.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground">{step}</li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  const { data: keys, isLoading } = trpc.integrations.getKeys.useQuery();

  const API_SERVICES: ApiService[] = ["fireflies", "granola", "zoom", "teams", "notion", "otter"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect your note-taking and transcription services. Each user connects their own account — your data stays private.
          </p>
        </div>

        {/* API Key Integrations */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            API Integrations
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Connect these services with an API key to import transcripts and notes directly.
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {API_SERVICES.map((service) => (
                <IntegrationCard
                  key={service}
                  service={service}
                  connected={keys?.[service]?.connected ?? false}
                  masked={keys?.[service]?.masked ?? null}
                />
              ))}
            </div>
          )}
        </section>

        {/* Paste / Upload Integrations */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Paste &amp; Import
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            These services don't offer a public API. Use the paste flow on the New Session page to import your content.
          </p>
          <div className="space-y-4">
            {PASTE_SERVICES.map((s) => (
              <PasteServiceCard key={s.name} service={s} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
