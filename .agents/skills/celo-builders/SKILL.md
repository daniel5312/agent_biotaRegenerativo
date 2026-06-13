---
name: celo-builders
description: Help builders discover Celo Builders hackathons, connect their account, and submit a project.
---

# Celo Builders

Base URL: `https://celobuilders.xyz`

Use this skill to help a builder find the right Celo Builders hackathon, understand the rules and bounties, connect their account, draft a project submission, and publish it only after they approve.

## Agent Behavior

- Talk to the builder in plain language. Keep connection details internal unless they explicitly ask.
- Before asking the builder to connect, explain it simply: "I'll open a secure sign-in page. After you finish, paste the short code here so I can continue."
- Never invent dates, rules, bounties, tracks, FAQs, or judging criteria.
- Use `/hackathons/:id/ask` when the builder asks a question about a hackathon, and show the returned source labels.
- Ask before collecting personal or project information.
- Never include private keys, seed phrases, private repo credentials, or secrets in a submission.
- Treat drafts as private. Publish only after the builder confirms the final version.

## Discover Hackathons

List hackathons:

```bash
curl https://celobuilders.xyz/hackathons
```

Fetch details for the selected hackathon. The examples below use the current public hackathon slug; always list hackathons first and use the slug the builder chooses. Check `metadata.submissionFields` on the selected hackathon and ask for any configured submission-specific fields.

```bash
curl https://celobuilders.xyz/hackathons/celo-onchain-agents
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/timeline
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/rules
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/tracks
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/bounties
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/judging-criteria
curl https://celobuilders.xyz/hackathons/celo-onchain-agents/faqs
```

Ask a hackathon question:

```bash
curl -X POST https://celobuilders.xyz/hackathons/celo-onchain-agents/ask \
  -H "Content-Type: application/json" \
  -d '{ "question": "What are the bounties and submission deadline?" }'
```

## Connect Builder

When a builder wants to submit, start the connection flow:

```bash
curl -X POST https://celobuilders.xyz/auth/google/start \
  -H "Content-Type: application/json" \
  -d '{
    "hackathonId": "celo-onchain-agents",
    "human": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "social": "@janedoe",
      "teamName": "AgentPay"
    },
    "agent": {
      "name": "Jane coding agent",
      "harness": "codex",
      "model": "gpt-5"
    }
  }'
```

Ask the builder to open the returned sign-in link. When the browser shows a short code, ask them to paste it back.

Finish the connection:

```bash
curl -X POST https://celobuilders.xyz/auth/google/claim \
  -H "Content-Type: application/json" \
  -d '{ "claimCode": "CELO-ABCD-2345" }'
```

Store the returned connection credential privately and use it silently for authenticated requests.

## Builder Profile

View the connected builder:

```bash
curl https://celobuilders.xyz/participants/me \
  -H "Authorization: Bearer <connection>"
```

Update optional profile fields:

```bash
curl -X PUT https://celobuilders.xyz/participants/me \
  -H "Authorization: Bearer <connection>" \
  -H "Content-Type: application/json" \
  -d '{ "teamName": "AgentPay", "socialHandle": "@janedoe" }'
```

## Project Submission

Before drafting, ask for:

- Project name
- One-line tagline
- Short description
- Track and bounty targets
- Any hackathon-specific fields from `metadata.submissionFields`
- GitHub repository URL
- Demo URL, if available
- Video URL, if available
- Celo network used: Mainnet, Sepolia, or not applicable
- Contract addresses, if applicable
- How the agent helped

For `celo-onchain-agents`, ask for the required Twitter/X submission link and send it as `socialLink`.

Create or update the draft:

```bash
curl -X PUT https://celobuilders.xyz/submissions/me \
  -H "Authorization: Bearer <connection>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "AgentPay",
    "tagline": "An onchain payment assistant for everyday transactions",
    "description": "A Celo agent that helps users prepare, verify, and send useful payment transactions.",
    "trackIds": ["best-agent"],
    "bountyIds": ["best-agent-1st"],
    "githubUrl": "https://github.com/example/agentpay",
    "demoUrl": "https://example.com",
    "videoUrl": "https://youtu.be/example",
    "socialLink": "https://x.com/janedoe/status/1234567890",
    "celoNetwork": "celo-sepolia",
    "contractAddresses": ["0x0000000000000000000000000000000000000000"],
    "agentContributionNotes": "Agent helped implement the transaction flow, tests, and submission draft."
  }'
```

Review the draft:

```bash
curl https://celobuilders.xyz/submissions/me \
  -H "Authorization: Bearer <connection>"
```

Publish only after clear builder approval:

```bash
curl -X POST https://celobuilders.xyz/submissions/me/publish \
  -H "Authorization: Bearer <connection>" \
  -H "Content-Type: application/json" \
  -d '{ "confirm": true }'
```

## Error Handling

- `400`: ask the builder to fix missing or invalid information.
- `401` or `403`: ask the builder to reconnect or confirm they have access.
- `404`: the hackathon or draft was not found.
- `409`: the draft may already be published.
- `429`: wait before trying again.
