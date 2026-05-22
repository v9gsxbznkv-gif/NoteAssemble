import SeoPageLayout from "./SeoPageLayout";

export default function ForConsultants() {
  return (
    <SeoPageLayout
      title="AI Meeting Notes for Consultants — NoteAssemble"
      metaDescription="NoteAssemble helps consultants capture client meeting decisions, track action items across engagements, and share structured recaps — without the admin overhead."
      headline="Stop Losing Billable Insights Between Client Meetings"
      subheadline="NoteAssemble turns client meetings into structured notes, tracked action items, and shareable recaps — so you spend less time on admin and more time delivering results."
      heroCtaText="Start Free"
      features={[
        {
          icon: "💼",
          title: "Organize by client or engagement",
          body: "Tag sessions by client name or project. Filter your action items and history by engagement — everything stays separated and searchable.",
        },
        {
          icon: "📤",
          title: "Send client-ready recaps instantly",
          body: "Share a clean, read-only summary link after every client call. No formatting, no email drafting — just a professional recap in one click.",
        },
        {
          icon: "🔍",
          title: "Surface decisions across engagements",
          body: "Search across all your client sessions to find when a decision was made, what was agreed, and who said what — without digging through notes.",
        },
        {
          icon: "⚡",
          title: "Works with any transcript source",
          body: "Paste from Zoom, Teams, Google Meet, or phone recordings. Connect Fireflies for automatic import. Upload handwritten notes as a photo.",
        },
        {
          icon: "📋",
          title: "Action items that follow up themselves",
          body: "Every session produces a tracked action list. Review open items before your next client call — no more starting meetings by asking 'where did we leave off?'",
        },
        {
          icon: "📅",
          title: "Weekly digest for Pro users",
          body: "Every Monday, get a summary of the past week across all your client engagements — decisions made, items still open, and what needs attention.",
        },
      ]}
      quote={{
        text: "I run 8-10 client calls a week. NoteAssemble is the only tool that actually keeps me on top of what I committed to across all of them.",
        author: "Independent Consultant",
        role: "Organizational strategy, 12 years",
      }}
      howItWorks={[
        "After each client call, paste the transcript or import from Fireflies — takes under a minute.",
        "NoteAssemble extracts decisions, action items, and key discussion points automatically.",
        "Tag the session with the client name and share the summary link directly with your client.",
        "Track open action items across all engagements from a single dashboard.",
      ]}
      closingHeadline="More time consulting. Less time on admin."
      closingBody="Free plan includes 10 sessions per month. Upgrade to Pro for unlimited sessions and weekly digest across all your client engagements."
    />
  );
}
