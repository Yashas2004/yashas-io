# Projects
All code on GitHub: https://github.com/Yashas2004
- TODO: Yashas to fill in — live demo links (if any).

## SnipIt — URL shortener with click analytics · Jul – Aug 2026
- Repo: https://github.com/Yashas2004/URL-shortner
- Short links with device, browser, OS and location analytics per click.
- Tracking runs asynchronously off the redirect path, so it adds no latency to the redirect.
- Tech: React, Express, MongoDB, JWT, Google OAuth.

## CodeVault — full-stack code snippet manager · Jun – Jul 2026
- Repo: https://github.com/Yashas2004/CODEVAULT
- FastAPI REST backend, JWT auth, PostgreSQL; ownership-scoped CRUD verified by cross-user security tests.
- Redis cache versioning that invalidates all of a user's cached queries in O(1) on writes; cursor-based pagination instead of offset.
- PostgreSQL full-text search (tsvector + GIN index + auto-update triggers) replacing ILIKE; sliding-window Redis rate limiting on auth endpoints.
- Dockerised; GitHub Actions CI runs the pytest suite (20/20 passing) on every push.
- Tech: Python, FastAPI, React, PostgreSQL, Redis, Docker, GitHub Actions.

## Colorize — GAN-based image colorization · Dec 2025 – Feb 2026
- Repo: https://github.com/Yashas2004/Image-colorization-Pipeline-using-GANs
- Conditional PatchGAN: U-Net generator with a ResNet18 ImageNet backbone (fastai DynamicUnet, transfer learning) + PatchDiscriminator; colorizes in LAB color space.
- Trained on 10,000 COCO images in 3 stages (baseline, supervised pre-training, adversarial fine-tuning), cutting convergence time by 70%.
- Deployed as a real-time Streamlit app.
- Tech: PyTorch, ResNet18, fastai, Streamlit.

## MailMind.io — AI email drafting agent · Mar – Apr 2026
- Repo: https://github.com/Yashas2004/MailMind.io-Email-Drafter-Agent
- LangGraph agent with a custom ReAct loop routing between 6 LangChain tools (recipient, subject, content) using GPT-4o in a stateful multi-turn workflow.
- Streamlit app with live split-panel draft preview, dynamic system prompt with live draft state, and local draft saving.
- Tech: LangGraph, LangChain, GPT-4o / OpenAI API, Streamlit.
