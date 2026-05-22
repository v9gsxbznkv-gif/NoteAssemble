import SeoPageLayout from "./SeoPageLayout";

export default function FirefliesAlternative() {
  return (
    <SeoPageLayout
      title="Fireflies Alternative for Churches & Consultants — NoteAssemble"
      metaDescription="NoteAssemble works with Fireflies.ai and is a simpler, more affordable alternative for pastors, church staff, and consultants who need structured meeting notes and action item tracking."
      headline="A Simpler Alternative to Fireflies for Leaders Who Run Meetings"
      subheadline="Fireflies is great for recording. NoteAssemble is built for what comes after — structured decisions, tracked action items, and organized follow-through across every meeting you run."
      heroCtaText="Try NoteAssemble Free"
      features={[
        {
          icon: "🔗",
          title: "Works with Fireflies",
          body: "Connect your Fireflies account and NoteAssemble automatically imports your transcripts. You get the best of both — Fireflies for recording, NoteAssemble for structured follow-through.",
        },
        {
          icon: "🏷️",
          title: "Organized by context, not just date",
          body: "Tag sessions by team, client, or ministry area. Filter your action items by category. Fireflies gives you a transcript library — NoteAssemble gives you an organized system.",
        },
        {
          icon: "✅",
          title: "Action items that actually get tracked",
          body: "Every session produces a clean action item list with context. Mark items complete, see what's still open, and review before your next meeting.",
        },
        {
          icon: "💰",
          title: "More affordable for small teams",
          body: "NoteAssemble Pro is $12/month for unlimited sessions. No per-seat pricing, no enterprise tiers required for basic features.",
        },
        {
          icon: "📤",
          title: "Shareable summaries without a login",
          body: "Send a read-only summary link to anyone — they don't need a NoteAssemble account to view it. Clean, professional, instant.",
        },
        {
          icon: "📅",
          title: "Weekly digest across all your meetings",
          body: "Pro users get a Monday morning summary of the past week — decisions made, open action items, and themes — across all their sessions.",
        },
      ]}
      quote={{
        text: "I still use Fireflies to record. But NoteAssemble is where I actually manage what came out of the meeting. The two work perfectly together.",
        author: "Church Consultant",
        role: "Blueprint 1122",
      }}
      howItWorks={[
        "Connect your Fireflies account in Settings — NoteAssemble will import your transcripts automatically.",
        "Or paste any transcript directly — from Zoom, Teams, Google Meet, or any other tool.",
        "NoteAssemble analyzes the content and extracts structured decisions and action items.",
        "Track open items, share summaries, and get a weekly digest across all your meetings.",
      ]}
      closingHeadline="Use Fireflies to record. Use NoteAssemble to follow through."
      closingBody="Free plan includes 10 sessions per month. Upgrade to Pro for unlimited sessions, Fireflies integration, and weekly digest."
    />
  );
}
