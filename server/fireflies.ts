/**
 * Fireflies GraphQL API client.
 * Accepts a per-user apiKey. Falls back to FIREFLIES_API_KEY env var if not provided.
 */

const FIREFLIES_API_URL = "https://api.fireflies.ai/graphql";

async function gql<T>(query: string, apiKey: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(FIREFLIES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Fireflies API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Fireflies GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  if (!json.data) throw new Error("Fireflies API returned no data");
  return json.data;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FirefliesMeeting {
  id: string;
  title: string;
  date: number; // Unix ms
  duration: number; // seconds
}

export interface FirefliesSentence {
  speaker_name: string;
  text: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Return the most recent N meetings (no transcript text). */
export async function getRecentMeetings(limit = 10, apiKey?: string | null): Promise<FirefliesMeeting[]> {
  const key = apiKey ?? process.env.FIREFLIES_API_KEY;
  if (!key) throw new Error("No Fireflies API key. Please add your Fireflies API key in Settings → Integrations.");
  const data = await gql<{ transcripts: FirefliesMeeting[] }>(
    `query GetRecent($limit: Int) {
      transcripts(limit: $limit) {
        id
        title
        date
        duration
      }
    }`,
    key,
    { limit }
  );
  return data.transcripts ?? [];
}

/** Search meetings by title keyword. */
export async function searchMeetings(title: string, limit = 10, apiKey?: string | null): Promise<FirefliesMeeting[]> {
  const key = apiKey ?? process.env.FIREFLIES_API_KEY;
  if (!key) throw new Error("No Fireflies API key. Please add your Fireflies API key in Settings → Integrations.");
  const data = await gql<{ transcripts: FirefliesMeeting[] }>(
    `query SearchMeetings($title: String, $limit: Int) {
      transcripts(title: $title, limit: $limit) {
        id
        title
        date
        duration
      }
    }`,
    key,
    { title, limit }
  );
  return data.transcripts ?? [];
}

/** Fetch the full transcript for a single meeting and return it as plain text. */
export async function getTranscriptText(transcriptId: string, apiKey?: string | null): Promise<{ title: string; text: string }> {
  const key = apiKey ?? process.env.FIREFLIES_API_KEY;
  if (!key) throw new Error("No Fireflies API key. Please add your Fireflies API key in Settings → Integrations.");
  const data = await gql<{
    transcript: { id: string; title: string; sentences: FirefliesSentence[] };
  }>(
    `query GetTranscript($id: String!) {
      transcript(id: $id) {
        id
        title
        sentences {
          speaker_name
          text
        }
      }
    }`,
    key,
    { id: transcriptId }
  );

  const t = data.transcript;
  if (!t) throw new Error(`Transcript ${transcriptId} not found`);

  const text = (t.sentences ?? [])
    .map((s) => `${s.speaker_name}: ${s.text}`)
    .join("\n");

  return { title: t.title, text };
}
