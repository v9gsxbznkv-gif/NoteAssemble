import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, ClipboardPaste, Upload, Crown, Smartphone, Download, Share2, Copy, Check, MessageSquare, Send } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";

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

// ─── Billing Section ──────────────────────────────────────────────────────────────

function BillingSection() {
  const [, navigate] = useLocation();
  const { data: billing, isLoading } = trpc.billing.getStatus.useQuery();
  const createPortal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message || "Failed to open billing portal"),
  });

  const plan = billing?.plan ?? "free";
  const planLabel = plan === "pro" ? "Pro" : plan === "team" ? "Team" : "Free";
  const isPaid = plan !== "free";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-base">Subscription</CardTitle>
        </div>
        <CardDescription>Manage your NoteAssemble plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-8 w-32 rounded bg-muted/40 animate-pulse" />
        ) : (
          <div className="flex items-center gap-3">
            <Badge variant={isPaid ? "default" : "secondary"} className={isPaid ? "bg-amber-600 text-white" : ""}>
              {planLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {plan === "free" ? "10 sessions/month" : "Unlimited sessions"}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {!isPaid && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate("/pricing")}>
              Upgrade Plan
            </Button>
          )}
          {isPaid && (
            <Button size="sm" variant="outline" disabled={createPortal.isPending} onClick={() => createPortal.mutate({ origin: window.location.origin })}>
              {createPortal.isPending ? "Opening..." : "Manage Billing"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => navigate("/pricing")}>
            View Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PWA Install Section ──────────────────────────────────────────────────────────────

function InstallAppSection() {
  const deferredPrompt = useRef<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);
    // Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as typeof deferredPrompt.current;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const choice = await deferredPrompt.current.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
      toast.success("NoteAssemble installed to your home screen!");
    }
    deferredPrompt.current = null;
  }

  if (isInstalled) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-500" />
          <CardTitle className="text-base">Install App</CardTitle>
        </div>
        <CardDescription>Add NoteAssemble to your home screen for quick access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canInstall && (
          <Button size="sm" onClick={handleInstall} className="gap-2">
            <Download className="w-4 h-4" />
            Install NoteAssemble
          </Button>
        )}
        {isIOS && !canInstall && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Install on iPhone / iPad:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the <strong>Share</strong> button in Safari (box with arrow)</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>Add</strong> — done</li>
            </ol>
          </div>
        )}
        {!canInstall && !isIOS && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Open NoteAssemble in Chrome or Edge on your device.</p>
            <p>Look for the install icon (<strong>⋮</strong> menu → <strong>Install app</strong>) in the address bar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Share & Refer Section ──────────────────────────────────────────────────────────────

const REFERRAL_CODE = "SHARE1MO";
const REFERRAL_URL = "https://noteassemble.com";
const SHARE_MESSAGE = `I've been using NoteAssemble to capture and analyze my meetings with AI — it's a game changer. Use code ${REFERRAL_CODE} at checkout for a free month of Pro: ${REFERRAL_URL}`;

function ShareSection() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NoteAssemble — AI Meeting Notes",
          text: SHARE_MESSAGE,
          url: REFERRAL_URL,
        });
      } catch {
        // User cancelled — no-op
      }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(SHARE_MESSAGE);
    setCopied(true);
    toast.success("Referral message copied!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-base">Share NoteAssemble</CardTitle>
        </div>
        <CardDescription>
          Share with a friend and they get their <strong>first month of Pro free</strong> — no credit card required upfront.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coupon callout */}
        <div
          style={{
            background: "color-mix(in oklch, var(--primary) 10%, transparent)",
            border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
            borderRadius: "8px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Referral coupon code</p>
            <p className="text-lg font-bold tracking-widest" style={{ color: "var(--primary)", fontFamily: "var(--font-mono, monospace)" }}>
              {REFERRAL_CODE}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">100% off first month of Pro</p>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: copied ? "oklch(60% 0.15 145)" : "var(--muted-foreground)",
              padding: "6px",
              borderRadius: "6px",
              transition: "color 0.2s",
            }}
            title="Copy code"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleShare}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            <Share2 className="w-4 h-4" />
            Share with a Friend
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Message"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          They enter code <strong>{REFERRAL_CODE}</strong> at checkout on the <a href="/pricing" className="underline">pricing page</a>. First month is completely free.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Contact Support Section ──────────────────────────────────────────────────

function ContactSupportSection() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMessage = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      setSent(true);
      setSubject("");
      setMessage("");
      toast.success("Message sent! We'll get back to you soon.");
    },
    onError: () => toast.error("Failed to send message. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    sendMessage.mutate({ subject: subject.trim(), message: message.trim() });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <CardTitle className="text-base">Contact Support</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Have a question or issue? Send us a message and we'll get back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Check size={20} className="text-primary" />
            </div>
            <p className="text-sm font-medium">Message received!</p>
            <p className="text-xs text-muted-foreground">We'll follow up with you directly.</p>
            <Button variant="outline" size="sm" onClick={() => setSent(false)} className="mt-1">Send another</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <Input
                placeholder="e.g. Can't connect Fireflies"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
              <textarea
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                required
                rows={4}
                style={{
                  width: "100%",
                  background: "var(--input)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ring)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/2000</p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={sendMessage.isPending || !subject.trim() || message.trim().length < 10}
            >
              {sendMessage.isPending ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Sending...</span>
              ) : (
                <span className="flex items-center gap-2"><Send size={14} /> Send Message</span>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────────────

export default function Settings() {
  const { data: keys, isLoading } = trpc.integrations.getKeys.useQuery();

  const API_SERVICES: ApiService[] = ["fireflies", "granola", "zoom", "teams", "notion", "otter"];

  return (
    <AppShell>
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

        {/* Billing */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Plan &amp; Billing
          </h2>
          <BillingSection />
        </section>

        {/* Share & Refer */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Share &amp; Refer
          </h2>
          <ShareSection />
        </section>

        {/* Contact Support */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Support
          </h2>
          <ContactSupportSection />
        </section>

        {/* Install App */}
        <section className="mt-10 mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Install App
          </h2>
          <InstallAppSection />
        </section>
      </div>
    </div>
    </AppShell>
  );
}
