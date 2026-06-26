const TOKEN_URL = "https://cxm-api.fifa.com/fifaplusweb/api/external/gameDay/token";
const STORIES_URL = "https://gameday-prod.fifa.mangodev.co.uk/1-0/stories";
const COMPETITION_ID = "285023";
const STAT_CLASSES = [
  "icp_fdcp_goals",
  "icp_assists",
  "icp_passes",
  "icp_attempt_at_goal",
  "icp_time_played",
  "icp_total_distance"
];

exports.handler = async () => {
  try {
    const tokenResponse = await fetch(TOKEN_URL, { headers: { accept: "application/json" } });
    if (!tokenResponse.ok) throw new Error(`Token HTTP ${tokenResponse.status}`);
    const token = (await tokenResponse.json()).token;
    if (!token) throw new Error("Missing FIFA token");

    const settled = await Promise.allSettled(STAT_CLASSES.map(name => fetchStatClass(name, token)));
    const players = new Map();
    settled.flatMap(result => result.status === "fulfilled" ? result.value : []).forEach(stats => {
      const key = stats.id || stats.name;
      if (!key) return;
      players.set(key, mergeStats(players.get(key) || {}, stats));
    });

    return json(200, {
      source: "fifa-gameday",
      competitionId: COMPETITION_ID,
      updatedAt: new Date().toISOString(),
      players: [...players.values()]
    });
  } catch (error) {
    return json(502, { error: "FIFA statistics unavailable", detail: error.message });
  }
};

async function fetchStatClass(name, token) {
  const query = `(and resourceStatus==\`urn:gd:resourceStatus:active\` _externalId~\`urn:gd:story:classification:${name}:competitionId:${COMPETITION_ID}:(.*):rank_asc:page:1$\`)`;
  const params = new URLSearchParams({
    query,
    skip: "0",
    limit: "1",
    sort: "tags.name==urn:gd:tag:story:fifa:column_number:asc"
  });
  const response = await fetch(`${STORIES_URL}?${params}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}`);
  const data = await response.json();
  return (data.items || []).flatMap(item => item.actors || []).map(parseActor).filter(Boolean);
}

function parseActor(actor) {
  const tags = Array.isArray(actor.tags) ? actor.tags : [];
  const tag = suffix => tags.find(item => item.name && item.name.endsWith(suffix))?.value;
  const stats = {
    id: actor.key?._externalSportsPersonId || "",
    name: actor.name?.por || actor.name?.eng || tag(":staff:display_name:por") || tag(":staff:display_name:eng") || "",
    teamCode: tag(":team:abbreviation") || "",
    teamName: tag(":team:name:por") || tag(":team:name:eng") || "",
    image: tag(":staff:image") || ""
  };
  tags.forEach(item => {
    const match = item.name && item.name.match(/football:stats:([^:]+)$/);
    if (match) stats[match[1]] = item.value;
  });
  return stats.id || stats.name ? stats : null;
}

function mergeStats(base, next) {
  const merged = { ...base };
  Object.entries(next || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  });
  return merged;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300",
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}
