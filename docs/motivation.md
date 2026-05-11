# Why oowl exists

Claude Code and its proprietary models sit at the top of the food chain for AI-assisted development. They are amazing tools — they unblock developers and accelerate real work. But the tool has become increasingly expensive and less accessible. Token limits. Session limits. Rate limits. How am I supposed to experiment and iterate on the side when the tools I rely on keep getting more restrictive and more expensive?

So I started digging in two directions: **alternative models**, and **an alternative TUI that could act as a drop-in replacement for Claude Code**.

## The open models

A lot of open-weight models match proprietary ones on SWE-Bench and other benchmarks. If you have the hardware, you can run GLM 5.1 or DeepSeek Pro locally with unlimited tokens and unlimited sessions, and they hold their own against Claude Opus 4.6 and GPT 5.4. They are also drastically cheaper: 1M tokens of GPT 5.4 is around $10; the same on DeepSeek Pro is around $0.10. Two orders of magnitude.

I don't have the hardware, so I looked for other ways in. I knew Ollama offered cloud access to these models, so I patched Claude Code to point at a local Ollama server instead of Anthropic's API. It worked — I got decent uninterrupted work done. But it felt clanky and hacky. Claude Code was not really *meant* for open models, and the seams showed.

## The TUI replacement

So I went looking for an alternative. I found [OpenCode](https://opencode.ai/). It's model-agnostic — connect it to OpenAI, Anthropic, Moonshot, anything. Switching models doesn't change your workflow. Better still, OpenCode offers two things that closed the loop on cost:

- **OpenCode Zen** — pay-as-you-go access to open models, no commitment.
- **OpenCode Go** — request-based pricing instead of token-based. DeepSeek v4 is roughly 16,000 requests/month for $5. For comparison, GitHub Copilot caps at 1,500 requests/month. More than 10× the budget at a fraction of the cost.

That was the no-brainer. OpenCode gave me access to the open models *and* a TUI flexible enough to switch between them on the fly.

## Where the pain met the solution

Once model-switching was available, the underlying pain points came into focus:

- **Same model for everything.** Architecture? Sure, use Opus or Sonnet. Writing a README or scaffolding a test file? You are paying premium rates for autocomplete.
- **Cost.** Open models are an order of magnitude cheaper. That budget unlocks experimentation and iteration that frontier-model pricing closes off.
- **Flexibility.** OpenCode lets you define custom agents and commands. Workflows are not shipped from a vendor — you build them.

That was the foundation. From there it was a natural progression. I started noticing that some models are visibly better at frontend, others at backend, some at writing prose, others at deep architectural reasoning. Different agents got different models. With agents and commands as building blocks, I could orchestrate a real workflow between them — a proper software development life cycle, built on top of [obra/superpowers](https://github.com/obra/superpowers).

I trimmed the bill further by compressing inter-agent chatter with Caveman-Lite.

In short: my motivation was twofold — find cost-effective and accessible models, and find a TUI that could replace Claude Code without compromise. Open models plus OpenCode gave me both. Everything in oowl — model-switching, role-specific agents, the design → plan → review flow, file locks, verification gates, Caveman compression — exists to serve one or both of those goals.
