import SeoPageLayout from "./SeoPageLayout";

export default function ForExecutivePastors() {
  return (
    <SeoPageLayout
      title="AI Notes for Executive Pastors — NoteAssemble"
      metaDescription="NoteAssemble helps executive pastors manage decisions, track action items across staff, elder, and leadership meetings, and stay on top of every commitment without the admin drag."
      headline="The Executive Pastor's System for Never Losing a Decision"
      subheadline="You run the meetings that run the church. NoteAssemble captures every decision, tracks every action item, and gives you a weekly digest across all your leadership conversations — so nothing falls through."
      heroCtaText="Start Free"
      features={[
        {
          icon: "🏛️",
          title: "One dashboard across all meetings",
          body: "Staff meetings, elder sessions, one-on-ones, campus leadership — tag each session and see all your open action items in one filtered view.",
        },
        {
          icon: "📋",
          title: "Action items with context",
          body: "Not just a task list — each action item includes the context from the meeting so you remember why it matters and what was decided around it.",
        },
        {
          icon: "📅",
          title: "Monday morning digest",
          body: "Pro users get a weekly AI-generated summary of the past week's sessions — decisions made, items still open, and patterns across your leadership conversations.",
        },
        {
          icon: "🔗",
          title: "Share with elders and board",
          body: "Send a clean, read-only summary link after elder meetings or board sessions. Professional, instant, no formatting required.",
        },
        {
          icon: "🎙️",
          title: "Works with Fireflies and Zoom",
          body: "Connect Fireflies.ai to import transcripts automatically. Or paste from Zoom, Teams, or any recording tool you already use.",
        },
        {
          icon: "🔒",
          title: "Confidential by default",
          body: "Sensitive leadership conversations stay private. Only you see your sessions unless you choose to share a specific summary link.",
        },
      ]}
      quote={{
        text: "As an XP I'm in 15-20 meetings a week across staff, elders, and campus leads. NoteAssemble is the only reason I know what I committed to in each one.",
        author: "Executive Pastor",
        role: "Multi-campus church, 3,000+ attendance",
      }}
      howItWorks={[
        "After each meeting, paste the transcript or connect Fireflies for automatic import.",
        "Tag the session — Staff, Elders, Campus, One-on-One — to keep everything organized.",
        "Review the AI-generated decisions and action items, then share a summary link if needed.",
        "Start every week with a Monday digest showing what's open, what was decided, and what needs your attention.",
      ]}
      closingHeadline="Run the church. Don't let the church run you."
      closingBody="Built for leaders who are in too many meetings to remember everything. Start free — no setup, no IT, no friction."
    />
  );
}
