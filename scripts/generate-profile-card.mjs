import { writeFile } from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "DilZhaan";
const startedAt = new Date(process.env.PROFILE_STARTED_AT || "2020-02-21T00:00:00+05:30");
const token = process.env.GITHUB_TOKEN;

const logo = [
  "':::::::::::::::::::::::::::::::::::::::::::::::::::      .:::::::::::::::",
  "  j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:j:`     .j:j:j:j:j:j:j:j`",
  "   !jjjjjjjjjjjjjjjjjjjjjjj::j::jjjjjjjjjjjjjjjj:`     .jjjjjjjjjjjjjj:`",
  "    'jjjjjjjjjjjjjjjjjjjj:      jjjjjjjjjjjjjjj:      jjjjjjjjjjjjjjj:",
  "     'jjjjjjjjjjjjjjjjjj'     .jjjjjjjjjjjjjjj`     _jjjjjjjjjjjjjjj`",
  "       !jjjjjjjjjjjjjjj`     \\jjjjjjjjjjjjjjj`     \\jjjjjjjjjjjjjjj`",
  "        !jjjjjjjjjjjj)`     |jjjjjjjjjjjjjj\\     \\jjjjjjjjjjjjjjj\\",
  "         /jjjjjjjjjj\\     \\jjjjjjjjjjjjjjj'     _jjjjjjjjjjjjjjj'",
  "           /jjjjjjj\\     \\jjjjjjjjjjjjjjj\\     \\jjjjjjjjjjjjjj)`",
  "            !xxxxz`     jxxxxxxxxxxxxxx\\     \\jxxxxxxxxxxxxxx\\",
  "             /xx\\     \\xxxxxxxxxxxxxxx\\     \\xxxxxxxxxxxxxxx\\",
  "               -     \\xxxxxxxxxxxxxxz\\     \\xxxxxxxxxxxxxxz\\",
  "                   \\\\xxxxxxxxxxxxxxx_----_xxxxxxxxxxxxxxx\\",
  "                  \\xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\\",
  "                 \\xxoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxy\\",
  "               \\\\oooooooooooooo\\-----{ooooooooooooooo\\",
  "              \\ooooooooooooooo\\     \\ooooooooooooooo\\     _",
  "             \\oooooooooooooop\\    \\\\oooooooooooooo\\\\     \\o//",
  "           \\\\oooooooooooooo\\     \\ooooooooooooooo\\     \\ooooo/",
  "          \\ooooooooooooooo\\     \\ooooooooooooooo\\     \\ooooooo/",
  "         \\oooo@ooo@ooo@o\\\\    \\\\oooo@ooo@ooo@o\\\\    \\\\ooooooooo//",
  "       \\\\@o@o@o@o@o@o@o\\     \\oo@o@oo@o@o@o@o\\     \\o@o@o@o@o@ooo/",
  "      \\o@o@o@o@o@o@o@o\\     \\o@o@o@@o@o@o@o@\\     \\o@o@o@o@o@o@@@o/",
  "     \\@@@@@@@@@@@@@@\\\\    \\\\@@@@@@o@@@@@@@\\\\    \\\\@@@@@@@@@@@@o@@@@//",
  "   \\\\@@@@@@@@@@@@@@\\     \\@@@@@@@@@@@@@@@}     \\o@@@@@@@@@@@@@@@@@@@@/",
  "  \\\\@@@@@@@@@@@@@@\\     \\@@@@@@@@@@@@@@@@@o@o@@@@@@@@@@@@@@@@@@@@@@@@@/",
  " \\@@@@@@@@@@@@@@\\\\    \\\\@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//",
  "g@@@@@@@@@@@@@@\\\\    _@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@,",
];

// --- Monospace grid ---------------------------------------------------------
// Everything is authored in character "columns". A conservative per-character
// advance (>= the widest common monospace font) is used only to turn columns
// into pixels, so a rendered line can never be wider than the space reserved
// for it, no matter which monospace font the viewer falls back to.
const MARGIN = 24;      // outer padding
const BODY = 16;        // body font-size (px)
const ART = 9.5;        // ascii-art font-size (px)
const ART_CHAR = 6.1;   // conservative advance at ART px
const BODY_CHAR = 10.0; // conservative advance at BODY px
const GAP = 20;         // gap between art column and panel
const PANEL_COLS = 60;  // width of the right panel, in characters
const LINE_STEP = 20;   // vertical distance between body rows
const ART_STEP = 11.4;  // vertical distance between art rows

const artCols = Math.max(...logo.map((line) => line.length));
const panelX = Math.round(MARGIN + artCols * ART_CHAR + GAP);
const cardWidth = Math.round(panelX + PANEL_COLS * BODY_CHAR + MARGIN);
const cardHeight = 408;
const FULL_COLS = Math.floor((cardWidth - 2 * MARGIN) / BODY_CHAR) - 1;

const FONT = "'Consolas', 'Menlo', 'DejaVu Sans Mono', 'Liberation Mono', monospace";

const themes = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    art: "#c9d1d9",
    line: "#3d444d",
    title: "#58a6ff",
    label: "#ffa657",
    dots: "#484f58",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: "#79c0ff",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    art: "#24292f",
    line: "#d0d7de",
    title: "#0969da",
    label: "#953800",
    dots: "#8c959f",
    text: "#24292f",
    muted: "#57606a",
    accent: "#0550ae",
  },
};

async function github(path) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": `${username}-profile-card`,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
  const response = await fetch(`https://api.github.com${path}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${path}`);
  }

  return response.json();
}

async function getProfile() {
  const user = await github(`/users/${username}`);
  const repos = await getRepos();
  const visibleRepos = repos.filter((repo) => !repo.fork);
  const languageCounts = getLanguageCounts(visibleRepos);
  const latestRepo = [...visibleRepos].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];

  const bio = clean(user.bio) || "Software Engineer";

  return {
    name: clean(user.name) || username,
    bio,
    role: bio.split("|")[0].trim() || "Software Engineer",
    company: clean(user.company) || "Available on GitHub",
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    forks: visibleRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
    gists: user.public_gists ?? 0,
    languages: languageCounts.slice(0, 5).map(([language]) => language).join(", ") || "JavaScript, TypeScript, Java",
    lastUpdated: formatDate(new Date()),
    latestRepo: latestRepo?.name || "No public repos yet",
    latestRepoPushed: latestRepo?.pushed_at ? formatDate(new Date(latestRepo.pushed_at)) : "n/a",
    location: clean(user.location) || "Earth",
    publicRepos: user.public_repos ?? repos.length,
    stars: visibleRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
    website: normalizeWebsite(user.blog) || `https://github.com/${username}`,
  };
}

async function getRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const batch = await github(`/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=pushed`);
    repos.push(...batch);

    if (batch.length < 100) {
      return repos;
    }

    page += 1;
  }
}

function getLanguageCounts(repos) {
  const counts = new Map();

  for (const repo of repos) {
    if (!repo.language) {
      continue;
    }

    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function clean(value) {
  return typeof value === "string" ? value.replace(/^@/, "").trim() : "";
}

function normalizeWebsite(value) {
  const cleaned = clean(value);

  if (!cleaned) {
    return "";
  }

  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function formatUptime(from, to = new Date()) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return [plural(years, "year"), plural(months, "month"), plural(days, "day")]
    .filter(Boolean)
    .join(", ");
}

function plural(value, label) {
  if (!value) {
    return "";
  }

  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Colombo",
    year: "numeric",
  }).format(date);
}

function truncate(value, maxLength) {
  const text = String(value);

  if (maxLength <= 0) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 3) {
    return text.slice(0, maxLength);
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function open(x, y, size) {
  return `  <text x="${x}" y="${y}" font-family="${FONT}" xml:space="preserve" font-size="${size}">`;
}

function span(fill, value) {
  return `<tspan fill="${fill}">${escapeXml(value)}</tspan>`;
}

// A dotted-leader row: ". Label: ........ value" filled to exactly `cols`
// characters, so the value column can never spill past the reserved width.
function leader(theme, label, value, cols, valueFill) {
  const prefix = `. ${label}: `;
  let text = String(value);
  let dots = cols - prefix.length - text.length - 1; // 1 = space before value

  if (dots < 3) {
    const maxValue = cols - prefix.length - 3 - 1;
    text = truncate(text, maxValue);
    dots = Math.max(0, cols - prefix.length - text.length - 1);
  }

  return span(theme.label, prefix) + span(theme.dots, ".".repeat(dots)) + span(valueFill, ` ${text}`);
}

function row(theme, y, label, value) {
  return open(panelX, y, BODY) + leader(theme, label, value, PANEL_COLS, theme.text) + "</text>";
}

function statRow(theme, y, leftLabel, leftValue, rightLabel, rightValue) {
  const half = 28; // 28 + " | " (3) + 28 = 59 <= PANEL_COLS
  return open(panelX, y, BODY)
    + leader(theme, leftLabel, leftValue, half, theme.accent)
    + span(theme.line, " | ")
    + leader(theme, rightLabel, rightValue, half, theme.accent)
    + "</text>";
}

function heading(theme, x, y, title, cols) {
  const dashes = Math.max(0, cols - title.length - 3); // "- " + title + " "
  return open(x, y, BODY)
    + span(theme.line, "-")
    + span(theme.title, ` ${title} `)
    + span(theme.line, "-".repeat(dashes))
    + "</text>";
}

function section(theme, y, title) {
  return heading(theme, panelX, y, title, PANEL_COLS);
}

function fullSection(theme, y, title) {
  return heading(theme, MARGIN, y, title, FULL_COLS);
}

function fullText(theme, y, value, fill = theme.text) {
  return open(MARGIN, y, BODY) + span(fill, truncate(value, FULL_COLS)) + "</text>";
}

function render(theme, profile) {
  // Vertically centre the whole art block within the card.
  const artBlock = (logo.length - 1) * ART_STEP + ART;
  const artTop = Math.round(((cardHeight - artBlock) / 2 + ART * 0.8) * 10) / 10;
  const art = logo
    .map((line, index) => {
      const y = (artTop + index * ART_STEP).toFixed(1);
      return `  <text x="${MARGIN}" y="${y}" fill="${theme.art}" font-family="${FONT}" xml:space="preserve" font-size="${ART}">${line}</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" role="img" aria-label="Live ASCII GitHub profile card for ${username}">
  <rect x="0.5" y="0.5" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="8" fill="${theme.bg}" stroke="${theme.border}"/>
${art}
${section(theme, 47.4, `${username}@github`)}
${row(theme, 67.4, "Name", profile.name)}
${row(theme, 87.4, "Role", profile.role)}
${row(theme, 107.4, "Uptime", formatUptime(startedAt))}
${row(theme, 127.4, "Location", profile.location)}
${row(theme, 147.4, "Company", profile.company)}
${row(theme, 167.4, "Languages", profile.languages)}
${section(theme, 207.4, "Contact")}
${row(theme, 227.4, "Website", profile.website)}
${row(theme, 247.4, "GitHub", `github.com/${username}`)}
${section(theme, 287.4, "Repo Status")}
${statRow(theme, 307.4, "Repos", profile.publicRepos, "Stars", profile.stars)}
${statRow(theme, 327.4, "Forks", profile.forks, "Gists", profile.gists)}
${statRow(theme, 347.4, "Followers", profile.followers, "Following", profile.following)}
${row(theme, 367.4, "Latest repo", profile.latestRepo)}
${row(theme, 387.4, "Last push", profile.latestRepoPushed)}
</svg>
`;
}

const profile = await getProfile();

await Promise.all([
  writeFile("img/dark_mode.svg", render(themes.dark, profile)),
  writeFile("img/light_mode.svg", render(themes.light, profile)),
]);

console.log(`Updated ${username} profile card: ${profile.publicRepos} repos, ${profile.stars} stars, ${profile.followers} followers (card ${cardWidth}x${cardHeight})`);
