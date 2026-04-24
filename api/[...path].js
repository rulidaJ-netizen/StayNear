export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_ORIGIN = "https://staynear-api-production.up.railway.app";
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

const readRequestBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
};

const buildTargetUrl = (pathParts, query) => {
  const normalizedPath = Array.isArray(pathParts)
    ? pathParts.map((part) => encodeURIComponent(String(part))).join("/")
    : "";
  const searchParams = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (key === "path" || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();

  return `${BACKEND_ORIGIN}/api/${normalizedPath}${queryString ? `?${queryString}` : ""}`;
};

const buildForwardHeaders = (headers) => {
  const nextHeaders = new Headers();

  Object.entries(headers || {}).forEach(([key, value]) => {
    const normalizedKey = String(key || "").toLowerCase();

    if (
      !value ||
      normalizedKey === "origin" ||
      HOP_BY_HOP_HEADERS.has(normalizedKey)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => nextHeaders.append(key, item));
      return;
    }

    nextHeaders.set(key, value);
  });

  return nextHeaders;
};

export default async function handler(req, res) {
  const targetUrl = buildTargetUrl(req.query?.path, req.query);
  const method = String(req.method || "GET").toUpperCase();
  const headers = buildForwardHeaders(req.headers);
  const body =
    method === "GET" || method === "HEAD" ? undefined : await readRequestBody(req);

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      const normalizedKey = key.toLowerCase();

      if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
        return;
      }

      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Vercel API proxy error:", error);
    res.status(502).json({ message: "Proxy request failed" });
  }
}
