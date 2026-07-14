<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-verification-rules -->
# Verification commands

- Do not run lint commands (`pnpm lint`, `eslint`, or equivalents) unless the user explicitly requests a lint check.
- Do not run production build commands (`pnpm build`, `next build`, or equivalents) unless the user explicitly requests a build check.
- Do not run tests by default and do not run a full test-suite baseline before routine changes.
- Do not run tests for documentation, file moves, renames, import-only changes, folder restructuring, formatting, or type-only refactors.
- For runtime behavior changes, run only the most directly relevant targeted test when it is needed to verify the change. Run the full test suite only when the user explicitly requests it.
- For code changes, run one focused TypeScript check at the end of the logical batch instead of after every intermediate edit. Skip TypeScript checks for documentation-only changes.
- For structural changes, use narrow searches to verify that old imports and paths are gone. Run `git diff --check` once at the end.
- Combine independent read-only checks into a single tool call when practical, and avoid printing the full repository tree or entire large files unless required.
<!-- END:project-verification-rules -->
