# React Website Demo

> Multi-page website with a persistent voice assistant that navigates pages, fills forms in real-time, and responds to user input — powered by MascotBot SDK and ElevenLabs Conversational AI.

**[Live Demo](https://react-website-demo-mascotbot.vercel.app)** | [Report Issue](https://github.com/mascotbot-templates/react-website-demo/issues)

![React Website Demo](docs/screenshot.png)

## What This Demonstrates

- **Persistent Voice Assistant** — MascotBot widget stays active across all page navigations with zero context loss
- **Conversational Navigation** — say "I need an estimate" and the AI navigates you to the right page
- **Live Form Autofill** — describe your move and watch form fields populate in real-time as you speak
- **Bidirectional Form Sync** — manually edit a field and the agent acknowledges it and moves on
- **Multi-Intent Handling** — three flows: moving estimate, careers, and franchise
- **ElevenLabs Client Tools** — `navigateTo`, `updateEstimateField`, `submitEstimate` bridge voice AI to page actions
- **Agent Testing** — ElevenLabs CLI test configs included for verifying tool call behavior

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- An [ElevenLabs](https://elevenlabs.io) account (for the voice agent)
- A [Mascot Bot](https://app.mascot.bot) account (for the animated avatar)
- A microphone

### 1. Clone and install

```bash
git clone https://github.com/mascotbot-templates/react-website-demo.git
cd react-website-demo
```

### 2. Add private files

```bash
# MascotBot SDK — download from your Mascot Bot dashboard
cp /path/to/mascotbot-sdk-react-0.1.9.tgz ./

# Rive animation file — download from your Mascot Bot dashboard
cp /path/to/mascot_widget.riv ./public/

# Install dependencies
pnpm install
```

### 3. Set up the ElevenLabs agent (one command)

This creates the full agent — system prompt, voice settings, LLM model, and all three client tools:

```bash
ELEVENLABS_API_KEY=sk_your_key node scripts/setup-agent.mjs
```

The script outputs an `ELEVENLABS_AGENT_ID`. Copy it for the next step.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```
MASCOT_BOT_API_KEY=your_mascotbot_key
ELEVENLABS_API_KEY=sk_your_elevenlabs_key
ELEVENLABS_AGENT_ID=agent_xxx  # from step 3
```

### 5. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), click the character in the bottom-right corner, and start talking.

## How It Works

### Architecture

```
layout.tsx (Server Component)
└── Providers (Client Component)
    ├── MascotProvider          — Rive animation context
    ├── DemoProvider            — Shared form state + navigation
    ├── NavigationHandler       — Watches for navigateTo commands → router.push()
    ├── SiteHeader              — Logo + centered nav links
    ├── {children}              — Page content
    │   ├── /                   — Home (hero, services, CTA)
    │   ├── /estimate           — Estimate form with live autofill
    │   ├── /careers            — Job listings
    │   └── /franchise          — Franchise info
    └── PersistentWidget        — MascotBot + ElevenLabs voice AI
        └── WidgetContent       — clientTools → DemoContext dispatch
```

### Data Flow

```
User speaks → ElevenLabs agent → client tool call
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              navigateTo     updateEstimateField   submitEstimate
                    │                 │                 │
                    ▼                 ▼                 ▼
            DemoContext          DemoContext         DemoContext
            dispatch()          dispatch()          dispatch()
                    │                 │                 │
                    ▼                 ▼                 ▼
          NavigationHandler     Estimate Form     Confirmation
          router.push()        field updates       screen
```

### Bidirectional Form Sync

When the user manually types in a form field:

1. The input fires `dispatch({ source: "user" })` — tagged so the widget ignores it
2. After 1.5s of no typing (debounce), `sendContextualUpdate()` sends a message to the ElevenLabs agent
3. The agent receives it as context (not as speech) and acknowledges: "Got it, moving on..."

This means the user can say "I'll type my email myself" — the agent waits, then resumes once the field is filled.

## ElevenLabs Agent Configuration

The `scripts/setup-agent.mjs` script creates the entire agent. Here's what it configures:

### LLM & Voice

| Setting | Value | Why |
|---------|-------|-----|
| LLM | `gpt-5.2` | Best tool-calling behavior — Gemini 2.5 Flash didn't call tools reliably |
| Temperature | `0.3` | Low enough for consistent tool calls, high enough for natural speech |
| TTS Model | `eleven_v3_conversational` | Optimized for conversational AI |
| Voice | `vBKc2FfBKJfcZNyEt1n6` | Natural conversational voice |
| Expressive Mode | `true` | Emotionally intelligent intonation |

### Client Tools

All tools are configured as **fire-and-forget** (`expects_response: false`, `response_timeout_secs: 1`) so the agent keeps talking while the UI updates:

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `navigateTo` | `page` (string) | Navigate to /, /estimate, /careers, /franchise |
| `updateEstimateField` | `field`, `value` (strings) | Fill a form field: name, email, phone, origin, destination, moveDate, homeSize, specialItems |
| `submitEstimate` | none | Submit the form (expects response for confirmation) |

### System Prompt Design

The prompt went through several iterations. Key lessons learned:

1. **Be explicit about tool usage** — "ALWAYS call tools. NEVER just talk about what you would do" prevents the agent from describing actions instead of performing them
2. **One navigation per topic** — "Call navigateTo ONCE when topic changes" prevents redundant calls
3. **Demo awareness** — "This is a DEMO website with static content" prevents the agent from making up company info
4. **Brevity constraint** — "MAX 2 sentences per response" keeps voice responses snappy
5. **Post-submission boundary** — "Do NOT ask about packing, storage, or extras" prevents the agent from improvising features that don't exist

## Adapting This Template to Your Own Project

This template is a boilerplate. The idea is to fork it, swap in your own pages, forms, and business logic, then iterate on the agent until it behaves the way you need. Here's the workflow we used to build this demo — and how you'd do the same for your project.

### The Iteration Loop

Building a good voice agent is like building any product feature: you write something, test it, see what's wrong, fix it, and repeat. The key difference is that voice agents need their own testing tools because you can't unit-test a conversation the way you test a function.

Here's the loop we followed:

```
1. Edit the system prompt or tool config
         │
         ▼
2. Simulate a conversation (API call, no voice needed)
         │
         ▼
3. Read the transcript — did the agent call the right tools?
         │                 Did it stay brief? Did it hallucinate?
         ▼
4. If broken → go back to step 1
   If good  → test with real voice
         │
         ▼
5. Check the real transcript for issues you missed
         │
         ▼
6. Write a test for whatever broke → go back to step 1
```

### Step 1: Edit the Agent Config

You have two options for editing:

**Option A: ElevenLabs CLI (recommended for version control)**

```bash
npm install -g @elevenlabs/cli
elevenlabs auth login

# Pull your agent config to local files
elevenlabs agents pull --agent YOUR_AGENT_ID

# Edit the config file
# The system prompt, LLM, voice, tools are all in agent_configs/*.json
code agent_configs/Website-Demo-Assistant.json

# Push changes back
elevenlabs agents push
```

This is the best workflow if you want to track prompt changes in git, review them in PRs, and roll back when something breaks.

**Option B: API directly (faster for quick iterations)**

```bash
curl -X PATCH "https://api.elevenlabs.io/v1/convai/agents/YOUR_AGENT_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_config": {
      "agent": {
        "prompt": {
          "prompt": "Your updated system prompt here..."
        }
      }
    }
  }'
```

Prompt changes take effect immediately — no redeployment needed.

### Step 2: Simulate Before You Speak

This is the most important step. Don't test every prompt change with your voice — it's slow and you'll burn through API credits. Instead, use the simulate-conversation API:

```bash
curl -X POST "https://api.elevenlabs.io/v1/convai/agents/YOUR_AGENT_ID/simulate-conversation" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_specification": {
      "simulated_user_config": {
        "first_message": "I need a moving estimate",
        "language": "en"
      },
      "max_turns": 4
    }
  }'
```

The response is a full transcript with tool calls. Parse it and check:

- **Are the right tools being called?** Look for `tool_calls` in each agent turn.
- **Are responses short?** Count sentences — they should be under 2.
- **Is the agent making up information?** It should redirect to the page, not invent answers.
- **Is it calling tools immediately?** Or is it asking clarifying questions first?

> **Caveat:** The simulated user generates its own messages and may not follow your `first_message` exactly. It's good for testing general behavior patterns, not specific word-for-word flows.

### Step 3: Write Tests for What Breaks

Every time you find a bug in simulation or voice testing, turn it into a test so it doesn't regress. This project includes test configs in `test_configs/`:

| Test | What it catches |
|------|----------------|
| `Navigate-to-estimate-on-request.json` | Agent fails to call `navigateTo("/estimate")` when user asks for an estimate |
| `Fill-fields-when-user-gives-details.json` | Agent doesn't call `updateEstimateField` when user provides move details |
| `Navigate-and-fill-on-first-message.json` | Agent doesn't both navigate AND fill when user gives everything upfront |

Run all tests:

```bash
elevenlabs agents test YOUR_AGENT_ID
```

Or run them via the CLI as part of CI:

```bash
elevenlabs agents test YOUR_AGENT_ID --exit-on-failure
```

To add a new test:

```bash
elevenlabs tests add "My new test" --template tool
# Edit the generated file in test_configs/
elevenlabs tests push
```

### Step 4: Voice Test and Review Transcripts

Only after simulation looks good, test with your actual voice. After the call, pull the transcript:

```bash
# List recent conversations
curl "https://api.elevenlabs.io/v1/convai/conversations?agent_id=YOUR_AGENT_ID&page_size=1" \
  -H "xi-api-key: $ELEVENLABS_API_KEY"

# Get full transcript with tool calls
curl "https://api.elevenlabs.io/v1/convai/conversations/CONVERSATION_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY"
```

Look for:
- Tool calls that fired but shouldn't have (or vice versa)
- Places where the agent was too verbose or too vague
- Moments where the agent improvised something outside its scope

Turn any issue you find into a test (step 3) and a prompt fix (step 1).

### Lessons We Learned Building This Demo

These are the specific issues we hit and how we fixed them. You'll likely hit similar ones when adapting for your project:

| What Went Wrong | Root Cause | How We Fixed It |
|----------------|-----------|-----------------|
| Agent described actions instead of performing them | Gemini 2.5 Flash wasn't calling tools | Switched to GPT-5.2 — much better at tool calling |
| Tools called but with empty parameters | PATCH API wiped `parameters` field to `null` | Always include full `parameters` schema when updating tools |
| Agent role-played a recruiter on the careers page | Prompt didn't set boundaries for static pages | Added "Do NOT describe specific roles. The page has that info." |
| Agent asked about packing/storage after form submit | No post-submission boundary in prompt | Added "After submitEstimate, STOP. Do NOT ask about extras." |
| Agent navigated to the same page 5 times | No "already on page" awareness | Added "Call navigateTo ONCE when topic changes" |
| Agent gave 10-sentence answers | No brevity constraint | Added "MAX 2 sentences per response. NEVER exceed this." |
| Connection hung forever on production | Vercel env vars had trailing `\n` | Used `printf` instead of `echo` when piping to `vercel env add` |
| Agent made up company knowledge | Prompt was too open-ended | Added "This is a DEMO. Do NOT make up information." |

## Customization

### Widget Appearance

Edit `WIDGET_CUSTOMIZATION` in `src/components/widget.tsx`:

```ts
const WIDGET_CUSTOMIZATION = {
  gender: 1,        // 1=male, 2=female
  outline: 10,      // 0-100 stroke thickness
  colourful: true,
  shirt_color: 2,   // 1-6
  // ... see file for all options
};
```

### Widget Size

Adjust the container in `PersistentWidget`:

```tsx
<div style={{ width: 300, height: 380 }}>
```

### Adding Pages

1. Create `src/app/your-page/page.tsx`
2. Add to `navItems` in `src/components/site-header.tsx`
3. Add the route to the agent's system prompt (PAGES list)
4. Update `navigateTo` tool description

### Adding Form Fields

1. Add to `EstimateFormData` in `src/lib/demo-context.tsx`
2. Add to `formFields` in `src/app/estimate/page.tsx`
3. Update `updateEstimateField` tool description
4. Update agent system prompt (FIELDS list)

## Private Files

### MascotBot SDK
- **File:** `mascotbot-sdk-react-0.1.9.tgz`
- **Location:** Project root
- **Get it:** [Mascot Bot dashboard](https://app.mascot.bot)

### Rive Animation
- **File:** `mascot_widget.riv`
- **Location:** `public/mascot_widget.riv`
- **Get it:** [Mascot Bot dashboard](https://app.mascot.bot)
- **Note:** Must be a Widget-type `.riv` file (uses the "Widget" artboard)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MASCOT_BOT_API_KEY` | MascotBot API key | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Yes |
| `ELEVENLABS_AGENT_ID` | ElevenLabs agent ID (from setup script) | Yes |
