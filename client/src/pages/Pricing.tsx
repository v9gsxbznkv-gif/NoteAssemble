import { useLocation } from "wouter";
import { Check, Zap, Users, Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const PLAN_ICONS = {
  free: Sparkles,
  pro: Zap,
  team: Users,
};

const PLAN_HIGHLIGHTS: Record<string, string> = {
  free: "Get started",
  pro: "Most popular",
  team: "For teams",
};

const FAQ_ITEMS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Plan & Billing at any time. You keep Pro access until the end of your billing period — no partial refunds, no penalties.",
  },
  {
    q: "What counts as a session?",
    a: "A session is one meeting or conversation you add to NoteAssemble — whether you paste a transcript, upload notes, or import from Fireflies. Each session gets its own AI analysis, action items, and share link.",
  },
  {
    q: "What happens when I hit the free plan limit?",
    a: "You can still view all your existing sessions and action items. You just can't create new sessions until the next month or until you upgrade to Pro.",
  },
  {
    q: "Does the referral code work on any plan?",
    a: "Yes. Use code SHARE1MO at checkout for Pro or Team and your first month is free. After that you're billed at the regular rate.",
  },
  {
    q: "What meeting tools does NoteAssemble work with?",
    a: "Anything. Paste a transcript from Zoom, Teams, Google Meet, or any other tool. You can also connect Fireflies.ai to import transcripts automatically, or upload a photo of handwritten notes.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Sessions are private by default. Only you can see them unless you explicitly share a session link. Shared links are read-only and can be revoked at any time.",
  },
  {
    q: "Does the weekly digest replace reviewing my notes?",
    a: "It's a supplement, not a replacement. Every Monday you get a summary of the past week's sessions — key decisions, open action items, and themes — so you start the week with full context without re-reading everything.",
  },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: billing } = trpc.billing.getStatus.useQuery(undefined, { enabled: !!user });
  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout");
    },
  });

  const currentPlan = billing?.plan ?? "free";

  const plans = [
    {
      key: "free" as const,
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Try NoteAssemble with no commitment.",
      features: [
        "10 sessions per month",
        "AI analysis & action items",
        "Photo & file import",
        "Fireflies integration",
        "Share links",
      ],
    },
    {
      key: "pro" as const,
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "Unlimited sessions for serious leaders.",
      features: [
        "Unlimited sessions",
        "AI analysis & action items",
        "Photo & file import",
        "All integrations",
        "Share links",
        "Weekly digest email",
        "Priority support",
      ],
    },
    {
      key: "team" as const,
      name: "Team",
      price: "$29",
      period: "per month",
      description: "Everything in Pro, built for teams.",
      features: [
        "Everything in Pro",
        "Team collaboration (coming soon)",
        "Admin dashboard (coming soon)",
        "Custom integrations",
        "Dedicated support",
      ],
    },
  ];

  function handleUpgrade(planKey: "pro" | "team") {
    if (!user) {
      navigate("/login");
      return;
    }
    createCheckout.mutate({ planKey, origin: window.location.origin });
    toast.info("Opening secure checkout...");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees, no annual lock-in.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.key];
            const isCurrent = currentPlan === plan.key;
            const isPro = plan.key === "pro";

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-all ${
                  isPro
                    ? "border-amber-600 bg-amber-950/10 shadow-lg shadow-amber-900/20"
                    : "border-border bg-card"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-600 text-white text-xs px-3 py-0.5">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPro ? "bg-amber-600/20" : "bg-muted"}`}>
                    <Icon className={`w-5 h-5 ${isPro ? "text-amber-500" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{PLAN_HIGHLIGHTS[plan.key]}</div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                {/* CTA */}
                {plan.key === "free" ? (
                  <Button
                    variant={isCurrent ? "outline" : "secondary"}
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => navigate("/")}
                  >
                    {isCurrent ? "Current plan" : "Get started free"}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isPro ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                    variant={isPro ? "default" : "outline"}
                    disabled={isCurrent || createCheckout.isPending}
                    onClick={() => handleUpgrade(plan.key)}
                  >
                    {isCurrent
                      ? "Current plan"
                      : createCheckout.isPending
                      ? "Opening checkout..."
                      : `Upgrade to ${plan.name}`}
                  </Button>
                )}

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
          <FAQAccordion />
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">
            Questions?{" "}
            <a href="/settings" className="underline hover:text-foreground">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
