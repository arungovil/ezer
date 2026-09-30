import { getEnv } from "../config/env.ts";
import type { ChatRow } from "../db/chat.ts";
import { listTasksByOriginId, searchTasksByOrigin, type TaskRow } from "../db/task.ts";
import { answerSystemPrompt, classifierSystemPrompt } from "../prompts/assistant.ts";
import { type ChatIntent, type Classification, parseClassification } from "../types/chat.ts";
import { getLlmClient } from "./llm-client.ts";

const retrievalLimit = 40;
const historyCharLimit = 500;
const notesContextCharLimit = 8000;

export interface AssistantState {
  intent: ChatIntent;
  topic: string;
  keywords: string[];
}

export interface AssistantReply {
  reply: string;
  rejected: boolean;
  state: AssistantState | null;
}

const refusalReply =
  "I can only answer from the notes you've saved on this page. Ask me whether you saved " +
  "something about a topic, or ask me to summarise a topic.";

export async function handleAssistantMessage(
  originId: string,
  userId: string,
  message: string,
  history: ChatRow[],
): Promise<AssistantReply> {
  const classification = await classify(message, history);

  if (classification.intent === "out_of_scope") {
    return { reply: refusalReply, rejected: true, state: null };
  }

  const state: AssistantState = {
    intent: classification.intent,
    topic: classification.topic,
    keywords: classification.keywords,
  };

  const hasTopic = classification.keywords.length > 0;
  let hits = hasTopic
    ? searchTasksByOrigin(originId, userId, classification.keywords, retrievalLimit)
    : listTasksByOriginId(originId, userId);
  let usedFallback = false;

  if (hits.length === 0 && hasTopic) {
    const anchorTopic = classification.topic;
    const differentFromKeywords =
      anchorTopic.length > 0 &&
      !(classification.keywords.length === 1 && classification.keywords[0] === anchorTopic);

    if (differentFromKeywords) {
      hits = searchTasksByOrigin(originId, userId, [anchorTopic], retrievalLimit);
      usedFallback = hits.length > 0;
    }
  }

  if (hits.length === 0) {
    return {
      reply: hasTopic
        ? nothingFoundReply(classification.topic)
        : emptyNotesReply(classification.intent),
      rejected: false,
      state,
    };
  }

  if (classification.intent === "specific" && !hasTopic) {
    return { reply: formatAllNotes(hits), rejected: false, state };
  }

  const reply = await answer(classification, hits, history, usedFallback);
  return { reply, rejected: false, state };
}

async function classify(message: string, history: ChatRow[]): Promise<Classification> {
  const conversation = history
    .map((turn) => {
      const state = turn.agentState ? ` [state: ${turn.agentState}]` : "";
      const role = turn.role === "ezer" ? "assistant" : "user";
      return `${role}: ${turn.content.slice(0, historyCharLimit)}${state}`;
    })
    .join("\n");

  const { llmModel } = getEnv();
  const completion = await getLlmClient().chat.completions.create({
    model: llmModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: classifierSystemPrompt },
      {
        role: "user",
        content: `Conversation so far:\n${conversation || "(none)"}\n\nLatest message: ${message}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty LLM response");
  }

  try {
    const parsed: unknown = JSON.parse(content);
    const classification = parseClassification(parsed);
    if (!classification) {
      return fallbackClassification(message);
    }

    return {
      ...classification,
      standaloneQuery: classification.standaloneQuery.trim() || message,
      topic: classification.topic.trim(),
      keywords: classification.keywords
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
    };
  } catch {
    return fallbackClassification(message);
  }
}

async function answer(
  classification: Classification,
  hits: TaskRow[],
  history: ChatRow[],
  usedFallback: boolean,
): Promise<string> {
  const notesContext = buildNotesContext(hits);
  const historyMessages = history.map((turn) =>
    turn.role === "ezer"
      ? { role: "assistant" as const, content: turn.content }
      : { role: "user" as const, content: turn.content },
  );

  const { llmModel } = getEnv();
  const completion = await getLlmClient().chat.completions.create({
    model: llmModel,
    temperature: 0.3,
    messages: [
      { role: "system", content: answerSystemPrompt },
      ...historyMessages,
      {
        role: "user",
        content: buildAnswerUserPrompt(classification, notesContext, usedFallback),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty LLM response");
  }

  return content.trim();
}

function buildNotesContext(hits: TaskRow[]): string {
  const sections: string[] = [];
  let totalLength = 0;

  for (const hit of hits) {
    const section = formatNote(hit);
    if (sections.length > 0 && totalLength + section.length > notesContextCharLimit) {
      break;
    }

    sections.push(section);
    totalLength += section.length;
  }

  const context = sections.join("\n\n");
  return sections.length < hits.length
    ? `${context}\n\n(Some notes were omitted to keep this concise.)`
    : context;
}

function formatNote(note: TaskRow): string {
  const meta: string[] = [note.kind];
  if (note.dueAt) {
    meta.push(`due ${note.dueAt}`);
  }

  const body = note.body?.trim() || note.summary?.trim() || note.title;
  return `[${note.title} — ${meta.join(", ")}]\n${body}`;
}

function buildAnswerUserPrompt(
  classification: Classification,
  notesContext: string,
  usedFallback: boolean,
): string {
  const fallbackNote = usedFallback
    ? "\n(The notes below are the closest match for the broader topic; they may not cover this specific question.)"
    : "";

  return [
    `Request type: ${classification.intent}`,
    `Question: ${classification.standaloneQuery}`,
    fallbackNote,
    "",
    "<notes>",
    notesContext,
    "</notes>",
  ]
    .join("\n")
    .trim();
}

function fallbackClassification(message: string): Classification {
  return {
    intent: "out_of_scope",
    standaloneQuery: message,
    topic: "",
    keywords: [],
  };
}

function nothingFoundReply(topic: string): string {
  return topic.length > 0
    ? `I couldn't find any notes about "${topic}" on this page.`
    : "I couldn't find any notes about that on this page.";
}

function emptyNotesReply(intent: ChatIntent): string {
  return intent === "summary"
    ? "There aren't any notes on this page to summarise yet. Highlight text on the page to save one."
    : "You haven't saved any notes on this page yet. Highlight text on the page to save one.";
}

function formatAllNotes(tasks: TaskRow[]): string {
  const lines = tasks.map((task) => {
    const kind = task.kind === "reminder" ? "Reminder" : "Note";
    const due = task.dueAt ? ` — due ${task.dueAt}` : "";
    return `- ${task.title} (${kind}${due})`;
  });

  const count = tasks.length === 1 ? "1 saved item" : `${tasks.length} saved items`;
  return `You've got **${count}** here:\n${lines.join("\n")}`;
}
