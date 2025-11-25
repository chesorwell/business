# TASK: Knowledge Base Chat System - Epistex

## What We're Building

A chat interface that answers questions by querying and synthesizing information from a custom knowledge base.

## Data

- **Size**: ~100 million tokens
- **Format**: Individual markdown files, one per source (transcribed audiobooks, podcast episodes, video courses, etc.)
- **Metadata**: Minimal frontmatter per file (title, author, category)

## Requirements

1. **Conversational** - Maintain full chat history across multiple turns
2. **Intelligent retrieval** - System must reason about which sources to query, make multiple retrieval attempts with different strategies before concluding
3. **Source citations** - Every answer must reference specific sources used
4. **Synthesis, not regurgitation** - Integrate information across sources, identify patterns and disagreements
5. **Honest about limitations** - If relevant information can't be found after multiple attempts, acknowledge this clearly (e.g., "The closest I found is X, but it doesn't quite answer your question")
6. **CLI chat interface**

## Priority

**Quality of information above all else.** This must be an intelligent system that reasons about queries and synthesizes knowledge - not a basic RAG retrieval system.

Use the most advanced reasoning models where needed to ensure highest quality results.

## Constraints

- **Cost target**: <$1 per query

## Success

User has multi-turn conversations → System intelligently retrieves and synthesizes relevant information → Returns accurate, source-cited answers or honestly acknowledges when information isn't available.
