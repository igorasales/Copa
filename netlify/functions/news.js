const RSS_URL = "https://news.google.com/rss/search?q=Copa%20do%20Mundo%202026%20futebol%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419";

exports.handler = async function handler() {
  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "user-agent": "Mozilla/5.0 Copa dashboard news fetcher"
      }
    });
    if (!response.ok) throw new Error(`RSS ${response.status}`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 10)
      .map(match => {
        const block = match[1];
        return {
          title: clean(readTag(block, "title")),
          link: clean(readTag(block, "link")),
          source: clean(readTag(block, "source")) || "Google Noticias",
          date: clean(readTag(block, "pubDate"))
        };
      })
      .filter(item => item.title && item.link);

    return json(200, { items });
  } catch (error) {
    return json(502, { items: [], error: error.message });
  }
};

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?: [^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : "";
}

function clean(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
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
