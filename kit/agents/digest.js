// Weekly digest for the Monday check-in (the Producer's first job). Run by .github/workflows/weekly-digest.yml.
// © 2026 justaskjoe. All rights reserved.
//
// Uses GitHub data only, which is already public, so the issue it writes is safe in this public repo.
// Pitches and playtest notes stay private: the digest links to the Studio home for those.
// No AI, no paid service: it costs nothing and needs no one's personal account.

// Public repos only: the digest is a public issue. forge went private on Oct 30, 2026, so it is left out
// (the workflow's own token can't read it anyway); its pull requests show in Studio HQ's Town Hall instead.
const REPOS = ["games"];
const DAY = 86400000;
const STUDIO = "https://jaj-forge.huntefl.workers.dev";
const BOARD = "https://github.com/orgs/JustAskJoe/projects/1";

const days = (t, now) => Math.floor((now - Date.parse(t)) / DAY);
const line = (x) => `[${x.repo}#${x.number}](${x.html_url}) ${x.title.replace(/[\r\n]+/g, " ").slice(0, 100)}`;

// github: anything with request(route, params) like Octokit's. Returns { title, body }.
async function buildDigest(github, owner, now = Date.now()) {
  const since = new Date(now - 7 * DAY).toISOString();
  const all = async (route, params) => {
    const out = [];
    for (let page = 1; page <= 5; page++) {
      const { data } = await github.request(route, { ...params, per_page: 100, page });
      out.push(...data);
      if (data.length < 100) break;
    }
    return out;
  };

  const merged = [], waiting = [], drafts = [], bugs = [], art = [], stuck = [];
  for (const repo of REPOS) {
    const closed = await all("GET /repos/{owner}/{repo}/pulls", { owner, repo, state: "closed", sort: "updated", direction: "desc" });
    for (const p of closed) if (p.merged_at && p.merged_at >= since) merged.push({ ...p, repo });
    const open = await all("GET /repos/{owner}/{repo}/pulls", { owner, repo, state: "open" });
    for (const p of open) (p.draft ? drafts : waiting).push({ ...p, repo, age: days(p.created_at, now), idle: days(p.updated_at, now) });
    const issues = (await all("GET /repos/{owner}/{repo}/issues", { owner, repo, state: "open" })).filter((i) => !i.pull_request);
    for (const i of issues) {
      const labels = i.labels.map((l) => l.name);
      const x = { ...i, repo, labels };
      if (labels.includes("digest")) continue;
      if (labels.includes("needs-human")) stuck.push(x);
      else if (labels.some((l) => l.startsWith("art"))) art.push(x);
      else if (labels.includes("bug")) bugs.push(x);
    }
  }
  waiting.sort((a, b) => b.age - a.age);

  const date = new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
  const s = [];
  s.push(`The Monday check-in agenda, made from GitHub. Pitches and playtest notes are private, so they're on the [Studio home](${STUDIO}), not here.`);
  s.push("");
  s.push(`### Needs a review (${waiting.length})`);
  s.push(waiting.length ? waiting.map((p) => `- ${line(p)} by ${p.user.login}, open ${p.age}d${p.age >= 3 ? " ⚠️" : ""}`).join("\n") : "- Nothing waiting.");
  if (stuck.length) { s.push("", `### An agent is stuck and wants a person (${stuck.length})`, stuck.map((i) => `- ${line(i)}`).join("\n")); }
  if (art.length) { s.push("", `### Art in progress (${art.length})`, art.map((i) => `- ${line(i)} (${i.labels.filter((l) => l.startsWith("art")).join(", ")})`).join("\n"), "Votes and picks happen in Studio HQ."); }
  s.push("", `### Open bugs (${bugs.length})`);
  s.push(bugs.length ? bugs.map((i) => `- ${line(i)}`).join("\n") : "- None filed.");
  s.push("", `### Merged this week (${merged.length})`);
  s.push(merged.length ? merged.map((p) => `- ${line(p)} by ${p.user.login}`).join("\n") : "- Nothing merged. Worth a minute at the check-in: what's blocking?");
  const quiet = drafts.filter((p) => p.idle >= 7);
  if (quiet.length) { s.push("", `### Drafts gone quiet (7+ days)`, quiet.map((p) => `- ${line(p)} by ${p.user.login}, last touched ${p.idle}d ago`).join("\n")); }
  s.push("", "### For the check-in");
  s.push("- Play the newest builds together in the Lab.");
  s.push("- Pick one review per person from the list above.");
  s.push(`- Agree this week's one or two goals on the [project board](${BOARD}).`);
  s.push("", "_Made by the weekly-digest workflow. Last week's digest closes when this one opens._");
  return { title: `This week at JustAskJoe · ${date}`, body: s.join("\n") };
}

// Entry point for actions/github-script.
async function run({ github, context, core }) {
  const { owner, repo } = context.repo;
  const { title, body } = await buildDigest(github, owner);
  try { await github.rest.issues.createLabel({ owner, repo, name: "digest", color: "4FD1C5", description: "Weekly check-in digest" }); } catch (e) { /* already exists */ }
  const old = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "open", labels: "digest" });
  const made = await github.rest.issues.create({ owner, repo, title, body, labels: ["digest"] });
  for (const i of old) await github.rest.issues.update({ owner, repo, issue_number: i.number, state: "closed", state_reason: "completed" });
  core.info(`Opened ${made.data.html_url}; closed ${old.length} older digest(s).`);
}

module.exports = { run, buildDigest };
