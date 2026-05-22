import SeoPageLayout from "./SeoPageLayout";

export default function ForPastors() {
  return (
    <SeoPageLayout
      title="AI Meeting Notes for Pastors — NoteAssemble"
      metaDescription="NoteAssemble helps pastors capture every decision, action item, and key moment from staff meetings, elder meetings, and counseling sessions — automatically."
      headline="AI Meeting Notes Built for Pastors"
      subheadline="Stop losing decisions between meetings. NoteAssemble turns your staff meetings, elder sessions, and one-on-ones into structured notes, action items, and follow-ups — automatically."
      heroCtaText="Start Free"
      features={[
        {
          icon: "⛪",
          title: "Built for ministry rhythms",
          body: "Tag sessions by ministry area — Worship, Facilities, Youth, Outreach — and filter your action items by team. Everything stays organized the way your church is organized.",
        },
        {
          icon: "📋",
          title: "Action items that don't get lost",
          body: "Every meeting produces a clean list of who owns what. Review open items before your next staff meeting without digging through notes or emails.",
        },
        {
          icon: "🤝",
          title: "Share meeting summaries instantly",
          body: "Send a read-only link to your elder board or staff team after every meeting. No more forwarding notes or typing up recaps.",
        },
        {
          icon: "🎙️",
          title: "Works with any transcript",
          body: "Paste from Zoom, Teams, or Google Meet. Connect Fireflies.ai for automatic import. Or upload a photo of handwritten notes from your legal pad.",
        },
        {
          icon: "📅",
          title: "Weekly digest every Monday",
          body: "Pro users get a Monday morning summary of the past week's sessions — decisions made, items still open, and themes across meetings.",
        },
        {
          icon: "🔒",
          title: "Private by default",
          body: "Sessions are only visible to you unless you choose to share them. Counseling notes and sensitive elder discussions stay confidential.",
        },
      ]}
      quote={{
        text: "I used to spend 20 minutes after every staff meeting typing up notes and sending follow-ups. Now I paste the transcript and it's done in 30 seconds.",
        author: "Executive Pastor",
        role: "Multi-site church, Southeast US",
      }}
      howItWorks={[
        "Add a session — paste a meeting transcript, upload notes, or connect Fireflies to import automatically.",
        "NoteAssemble analyzes the content and extracts key decisions, action items, and discussion themes.",
        "Review the structured summary, assign owners to action items, and share a link with your team.",
        "Check your open action items before the next meeting — filtered by ministry area if you've added tags.",
      ]}
      closingHeadline="Every meeting. Every decision. Nothing lost."
      closingBody="Free plan includes 10 sessions per month. Upgrade to Pro for unlimited sessions, weekly digest, and priority support."
    />
  );
}
