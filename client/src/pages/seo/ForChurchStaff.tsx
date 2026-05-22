import SeoPageLayout from "./SeoPageLayout";

export default function ForChurchStaff() {
  return (
    <SeoPageLayout
      title="Church Staff Meeting Summary Tool — NoteAssemble"
      metaDescription="NoteAssemble automatically summarizes church staff meetings, captures decisions, and tracks action items so your team stays aligned between Sundays."
      headline="Keep Your Church Staff Aligned Between Meetings"
      subheadline="NoteAssemble turns your weekly staff meetings into structured summaries, clear decisions, and tracked action items — so nothing falls through the cracks before Sunday."
      heroCtaText="Start Free"
      features={[
        {
          icon: "📝",
          title: "Automatic meeting summaries",
          body: "Paste your meeting transcript or connect Fireflies and NoteAssemble produces a clean, structured summary in seconds — no manual note-taking required.",
        },
        {
          icon: "✅",
          title: "Track who owns what",
          body: "Action items are extracted automatically with context. See every open item across all your staff meetings in one place.",
        },
        {
          icon: "🏷️",
          title: "Organize by ministry area",
          body: "Tag sessions by team — Worship, Kids, Youth, Operations — and filter your action items by area. Your dashboard mirrors your org chart.",
        },
        {
          icon: "🔗",
          title: "Share with your team",
          body: "Send a read-only summary link to staff members who couldn't attend. No login required to view — just a clean, shareable recap.",
        },
        {
          icon: "📊",
          title: "See patterns across meetings",
          body: "The AI surfaces recurring themes and unresolved items across sessions — so you can spot what keeps coming up before it becomes a problem.",
        },
        {
          icon: "📱",
          title: "Works on your phone",
          body: "Add NoteAssemble to your iPhone or Android home screen. Review action items and add new sessions from anywhere — no app store required.",
        },
      ]}
      quote={{
        text: "Our staff meetings used to end and everyone walked out with a different idea of what was decided. Now we share the summary link before people leave the room.",
        author: "Church Administrator",
        role: "1,200-member church, Midwest",
      }}
      howItWorks={[
        "Record or transcribe your staff meeting using Zoom, Teams, or any tool you already use.",
        "Paste the transcript into NoteAssemble or connect Fireflies for automatic import.",
        "Review the AI-generated summary, decisions list, and action items — edit anything that needs clarification.",
        "Share the summary link with your team and track open items until the next meeting.",
      ]}
      closingHeadline="Run tighter staff meetings. Build a stronger team."
      closingBody="Start free with 10 sessions per month. No setup required — works with any meeting tool you already use."
    />
  );
}
