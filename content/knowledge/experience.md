# Experience
## Software Engineer Intern — Way to Credit Pvt Ltd (Bangalore) · Jul 2026 – Present
- Sole developer; built and deployed a live internal loan-status portal designed for up to 300 concurrent staff, with owner/admin/user roles: admins curate a bank/loan/status knowledge base; users look up records, raise queries and earn credits.
- Designed a 14-table PostgreSQL schema with Drizzle migrations and Redis caching (description tree cached with version-key invalidation); JWT auth over httpOnly cookies with refresh-token rotation, family-based theft detection, server-side RBAC on every route, and IST access windows that end in-flight sessions at the operating-hours cutoff.
- Built an idempotent credits engine on an append-only ledger to prevent double-awards, and GitHub Actions CI running lint, typecheck and tests against a live Postgres container so schema drift fails the build.
- Tech: TypeScript, PostgreSQL, Drizzle, Redis, JWT, GitHub Actions.

## AI Intern — Supr Mentr Technologies Pvt Ltd (Bangalore) · Jan 2026 – May 2026
- Built Cognito, an autonomous AI research agent: ReAct reasoning loop with GPT-4o for iterative multi-query retrieval, turning open-ended requests from non-technical users into structured research reports.
- Built a RAG pipeline: ChromaDB as persistent vector store, OpenAI text-embedding-3-small, cosine-similarity threshold filtering for better retrieval precision.
- Modular architecture separating document ingestion, web scraping (BeautifulSoup), vector storage and agent reasoning; ran test plans and traced poor retrievals to root causes in ingestion and cosine-similarity filtering.
- Worked in a small team via code reviews and integration testing.
- Tech: Python, GPT-4o, RAG, ChromaDB, OpenAI Embeddings, BeautifulSoup.
