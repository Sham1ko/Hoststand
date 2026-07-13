<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-verification-rules -->
# Verification commands

- Do not run lint commands (`pnpm lint`, `eslint`, or equivalents) unless the user explicitly requests a lint check.
- Do not run production build commands (`pnpm build`, `next build`, or equivalents) unless the user explicitly requests a build check.
- When verification is needed, prefer focused TypeScript checks and relevant tests that stay within the requested scope.
<!-- END:project-verification-rules -->
