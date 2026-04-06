#!/usr/bin/env node
/**
 * Setup ElevenLabs Agent for React Website Demo.
 *
 * Creates the conversational AI agent with all client tools, system prompt,
 * voice settings, and LLM configuration — everything needed in one command.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_xxx node scripts/setup-agent.mjs
 *
 * Output:
 *   Prints the ELEVENLABS_AGENT_ID to put in your .env.local
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Error: Set ELEVENLABS_API_KEY environment variable");
  console.error("  Get yours at https://elevenlabs.io/app/settings/api-keys");
  process.exit(1);
}

const API = "https://api.elevenlabs.io/v1";

// ── System Prompt ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a website assistant with THREE tools you MUST use:

1. navigateTo(page) - Navigate to a page. Call when user wants to go somewhere.
2. updateEstimateField(field, value) - Fill a form field on the estimate page.
3. submitEstimate() - Submit the estimate form.

TOOL RULES:
- Call navigateTo ONCE when topic changes. Do NOT call again if already on that page.
- When user provides move details, call updateEstimateField for EACH piece of info IMMEDIATELY.
- Call MULTIPLE updateEstimateField tools at once for multiple details.
- NEVER repeat back values. Say "Got it" and ask about remaining empty fields.

ESTIMATE FLOW:
- User mentions estimate/quote/moving → call navigateTo("/estimate") then ask for details.
- For each detail: name → updateEstimateField("name", value), origin → updateEstimateField("origin", value), etc.
- Fields: name, email, phone, origin, destination, moveDate, homeSize, specialItems
- After submitEstimate, say "Submitted! Anything else?" and STOP. Do NOT ask about packing, storage, or extras.

CAREERS PAGE:
- Navigate to /careers ONCE and say "Here are our current openings! Take a look at the listings."
- Do NOT describe specific roles, qualifications, pay, or hiring processes. The page has that info.
- If user asks about specific roles, say "You can see the details for each role on the page. Want to explore something else?"

FRANCHISE PAGE:
- Navigate to /franchise ONCE and say "Here is our franchise info including investment details."
- Do NOT elaborate beyond what the page shows.

CRITICAL STYLE RULES:
- MAX 2 sentences per response. NEVER exceed this.
- This is a DEMO website with static content. You navigate and fill forms. You do NOT have real company knowledge.
- Do NOT make up information about jobs, pay, qualifications, or processes.
- If user asks detailed questions, redirect: "The page has those details! Want to explore something else?"
- You may receive contextual updates about manual form edits. Acknowledge briefly and continue.

PAGES: / (home), /estimate (form), /careers (jobs), /franchise`;

// ── Tool Definitions ─────────────────────────────────────────────────

const TOOLS = [
  {
    name: "navigateTo",
    description:
      "Navigate to a page. Fire-and-forget — call and keep talking. Pages: /, /estimate, /careers, /franchise",
    expects_response: false,
    response_timeout_secs: 1,
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          description: "Page path: /, /estimate, /careers, /franchise",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "updateEstimateField",
    description:
      "Instantly update a form field. Fire-and-forget — call and keep talking. Call multiple times in rapid succession for different fields.",
    expects_response: false,
    response_timeout_secs: 1,
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description:
            "Field name: name, email, phone, origin, destination, moveDate, homeSize, specialItems",
        },
        value: { type: "string", description: "Value to set" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "submitEstimate",
    description:
      "Submit the completed moving estimate form. Returns a confirmation message.",
    expects_response: true,
    response_timeout_secs: 5,
    parameters: { type: "object", properties: {}, required: [] },
  },
];

// ── API Helper ───────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error ${res.status}: ${text}`);
    process.exit(1);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Setting up ElevenLabs agent for React Website Demo...\n");

  // Step 1: Create tools
  const toolIds = [];
  for (const tool of TOOLS) {
    process.stdout.write(`  Creating tool: ${tool.name}... `);
    const result = await api("POST", "/convai/tools", {
      name: tool.name,
      description: tool.name,
      tool_config: {
        type: "client",
        name: tool.name,
        description: tool.description,
        expects_response: tool.expects_response,
        response_timeout_secs: tool.response_timeout_secs,
        execution_mode: "immediate",
        force_pre_tool_speech: false,
        parameters: tool.parameters,
      },
    });
    toolIds.push(result.id);
    console.log(`✓ ${result.id}`);
  }

  // Step 2: Create agent with tools linked
  process.stdout.write("\n  Creating agent... ");
  const agent = await api("POST", "/convai/agents/create", {
    name: "Website Demo Assistant",
    conversation_config: {
      agent: {
        prompt: {
          prompt: SYSTEM_PROMPT,
          llm: "gpt-5.2",
          temperature: 0.3,
          max_tokens: -1,
          tool_ids: toolIds,
        },
        first_message: "Hey! How can I help you today?",
        language: "en",
      },
      tts: {
        model_id: "eleven_v3_conversational",
        voice_id: "vBKc2FfBKJfcZNyEt1n6",
        expressive_mode: true,
        stability: 0.5,
        speed: 1.0,
        similarity_boost: 0.8,
      },
    },
  });
  console.log(`✓ ${agent.agent_id}`);

  // Done
  console.log(`
${"═".repeat(50)}
  ✅ Setup complete!

  Agent ID: ${agent.agent_id}

  Add to your .env.local:
    ELEVENLABS_AGENT_ID=${agent.agent_id}
${"═".repeat(50)}
`);
}

main();
