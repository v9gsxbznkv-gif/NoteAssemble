import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, EyeOff, ExternalLink } from "lucide-react";

type Service = "fireflies" | "notion" | "otter";

const SERVICE_INFO: Record<Service, {
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
    description: "Import notes and pages from your Notion workspace.",
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
};

function IntegrationCard({ service, connected, masked }: {
  service: Service;
  connected: boolean;
  masked: string | null;
}) {
  const utils = trpc.useUtils();
  const [inputKey, setInputKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const info = SERVICE_INFO[service];

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

export default function Settings() {
  const { data: keys, isLoading } = trpc.integrations.getKeys.useQuery();

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

        {/* Integrations section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Integrations</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <IntegrationCard
                service="fireflies"
                connected={keys?.fireflies.connected ?? false}
                masked={keys?.fireflies.masked ?? null}
              />
              <IntegrationCard
                service="notion"
                connected={keys?.notion.connected ?? false}
                masked={keys?.notion.masked ?? null}
              />
              <IntegrationCard
                service="otter"
                connected={keys?.otter.connected ?? false}
                masked={keys?.otter.masked ?? null}
              />
            </div>
          )}
        </section>

        {/* Coming soon section */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Coming Soon</h2>
          <div className="space-y-3">
            {["Rev.com", "Zoom Meetings", "Google Meet", "Microsoft Teams"].map((name) => (
              <div key={name} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-sm font-medium text-muted-foreground">{name}</span>
                <Badge variant="outline" className="text-xs text-muted-foreground">Coming soon</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
