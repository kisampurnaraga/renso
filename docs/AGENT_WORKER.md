# Renso owner task queue

The office has two separate actions: chat plans work; the owner queue saves and dispatches concrete work. A chat reply never counts as execution. The worker uses Groq in GitHub Actions; it is not an automatic connection to a ChatGPT conversation.

## Activate

1. Run `db/002_agent_jobs.sql` against the same Neon database as the app. In the Neon SQL editor, run each complete `CREATE TABLE` or `CREATE INDEX` statement separately if the editor rejects multiple commands. Existing guest sessions and chat tables remain unchanged. From a configured local environment, `npm run db:migrate` applies both migrations.
2. In Vercel project Renso → Settings → Environment Variables, add `OWNER_ACCESS_KEY` (a random secret of at least 24 characters). Add it to Production; redeploy after configuration. This key signs the eight-hour owner cookie. Rotating it invalidates existing owner sessions. Keep it out of chat, Git, screenshots, and `VITE_` variables.
3. Create a GitHub fine-grained personal access token restricted to **kisampurnaraga/renso**, with **Actions: Read and write**, **Pull requests: Read**, **Contents: Read**. Store it as Vercel server variable `GITHUB_DISPATCH_TOKEN`. The app can dispatch the fixed worker workflow and read its results; this token does not grant code write access.
4. In GitHub repository Settings → Secrets and variables → Actions, add secret `GROQ_API_KEY`. The key already configured in Vercel is not automatically available to Actions. Optionally set the repository variable `GROQ_MODEL`; default is `openai/gpt-oss-20b`. Account quotas and model availability still apply.
5. In GitHub Settings → Actions → General → Workflow permissions, allow GitHub Actions to create pull requests. The publishing job requests Contents and Pull requests write access using its temporary `GITHUB_TOKEN`.
6. Open [the office](https://renso-ashy.vercel.app/#/team), sign in as owner, select the team, review the task instructions, save, then dispatch. Refresh task status to retrieve actual GitHub results. Opening the page alone does not dispatch tasks.

Do not put private information in instructions: this is a public repository. Workflow input, generated code, artifacts and draft PRs may be visible to others. The form does not accept arbitrary repositories, commands, or destinations.

## Status and evidence

`queued` means saved in Neon. `dispatching` is an atomic dispatch claim. `dispatched` means GitHub accepted the request; `running` requires an observed workflow run in progress. `review_ready` requires a successful run and an observed draft PR. Failed runs and rejected dispatches are shown separately. A dispatch with an uncertain network result is not automatically retried: inspect GitHub before submitting a replacement, to avoid duplicate work.

The worker creates bounded code or documentation edits, runs tests and the frontend build, and opens a **draft PR**. It does not merge, deploy, send campaigns, purchase services, diagnose users, or start community outreach. Some tasks will exceed its supported scope or fail validation; their status must stay failed or queued, not completed.

Generated code is tested in a separate job without the Groq key or GitHub write token. Publishing never executes generated code. Allowed paths and edit sizes are validated before applying artifacts. Authentication, queue implementation, deployment/workflow configuration and dependency changes require a separate reviewed change.

The queue is persisted in Neon; owner credentials are not. Guest chat and existing scheduled email reports remain separate. Email automation does not make the worker run continuously, and no new report integration is claimed until verified.

## References

- [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
- [Groq chat completions API](https://console.groq.com/docs/api-reference)
