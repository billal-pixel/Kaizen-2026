import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini initialization with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Automated Performance Report Generator Endpoint
app.post("/api/ai-report", async (req, res) => {
  try {
    const { stationedData, virtualData, timeLogs, tasks, teamLeader = "Muhammad Billal" } = req.body;

    const prompt = `
You are an executive AI Operations Analyst assisting Team Leader ${teamLeader} of KAIZEN TEAM (10 Minute School).
Analyze the following operational data for both Stationed Advisors and Virtual Advisors:

STATIONED ADVISORS METRICS:
${JSON.stringify(stationedData, null, 2)}

VIRTUAL ADVISORS METRICS:
${JSON.stringify(virtualData, null, 2)}

RECENT TASKS STATUS:
${JSON.stringify(tasks, null, 2)}

OPERATIONAL TIME LOGS:
${JSON.stringify(timeLogs, null, 2)}

Provide a structured, professional executive performance report formatted in clean Markdown JSON.
Return JSON with the following structure:
{
  "executiveSummary": "A concise overview (2-3 paragraphs) of team health, overall sales achieved, call efficiency, and KPI distribution.",
  "stationedAnalysis": "Key findings for Stationed advisors (Reach, Talktime, CE Count, Exam/Briefing marks, Break/Meeting averages).",
  "virtualAnalysis": "Key findings for Virtual advisors (Reach Calls, Talktime, Meeting, Actual Talk Time, CE Count, Sales, TT Amount, Salary/Incentive performance).",
  "topPerformers": ["List of top 3 advisors across both teams with their key strengths"],
  "areasForImprovement": ["List of 3 key operational bottlenecks e.g. excessive breaks, exam mark drops, low CE count"],
  "coachingActions": ["List of 4 clear, high-impact tactical recommendations for Muhammad Billal to execute this week"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let resultJson = {};
    if (response.text) {
      try {
        resultJson = JSON.parse(response.text.trim());
      } catch {
        resultJson = { raw: response.text };
      }
    }

    res.json({ success: true, report: resultJson });
  } catch (error: any) {
    console.error("AI Report generation error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate AI performance report.",
    });
  }
});

// In-memory cache for CSV responses (TTL 15 seconds)
const sheetCsvCache = new Map<string, { timestamp: number; text: string }>();

// Helper to fetch CSV from Google Sheets using fast gviz and fallback export endpoints
async function fetchGoogleSheetCsv(docId: string, gid?: string): Promise<string | null> {
  const cacheKey = `${docId}_${gid || "default"}`;
  const cached = sheetCsvCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 15000) {
    return cached.text;
  }

  const gvizUrl = gid !== undefined && gid !== null
    ? `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`
    : `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv`;

  const exportUrl = gid !== undefined && gid !== null
    ? `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`
    : `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;

  const urlsToTry = [gvizUrl, exportUrl];

  for (const url of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
        },
      });
      clearTimeout(timeoutId);

      if (!resp.ok) continue;
      const text = await resp.text();
      if (
        text &&
        !text.includes("<!DOCTYPE html>") &&
        !text.includes("document-root") &&
        !text.includes("ServiceLogin") &&
        !text.includes("sign-in") &&
        text.trim().length > 10
      ) {
        sheetCsvCache.set(cacheKey, { timestamp: Date.now(), text });
        return text;
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError' || e.name === 'TimeoutError') {
        console.log(`[Sheet Sync] Request timed out for doc ${docId} gid ${gid || '0'}, trying fallback...`);
      } else {
        console.warn(`[Sheet Sync] Fetch notice for doc ${docId} gid ${gid || '0'}:`, e?.message || e);
      }
    }
  }
  return null;
}

// Proxy route to fetch public Google Sheet CSV content
app.get("/api/sheets-proxy", async (req, res) => {
  try {
    const sheetUrl = (req.query.url as string) || "";
    const customGid = req.query.gid as string;

    const DEFAULT_DOC_ID = "1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys";
    let docId = DEFAULT_DOC_ID;

    if (sheetUrl) {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        docId = match[1];
      }
    }

    const gidMatch = sheetUrl ? sheetUrl.match(/gid=([0-9]+)/) : null;
    const gid = customGid || (gidMatch ? gidMatch[1] : undefined);

    let csvText = await fetchGoogleSheetCsv(docId, gid);
    if (!csvText && docId !== DEFAULT_DOC_ID) {
      // Fallback to default Kaizen sheet if provided URL fails
      docId = DEFAULT_DOC_ID;
      csvText = await fetchGoogleSheetCsv(DEFAULT_DOC_ID, gid);
    }

    if (!csvText) {
      return res.status(403).json({ error: "Google Sheet is restricted, private, or unavailable." });
    }

    res.type("text/csv").send(csvText);
  } catch (err: any) {
    console.error("Sheets proxy error:", err);
    res.status(500).json({ error: err?.message || "Failed to fetch Google Sheet data" });
  }
});

// Endpoint to fetch both Stationed (gid=0) and Virtual (gid=1487776310 or active gid) tabs simultaneously
app.get("/api/sheets-sync-all", async (req, res) => {
  try {
    const sheetUrl = (req.query.url as string) || "";
    const DEFAULT_DOC_ID = "1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys";
    let docId = DEFAULT_DOC_ID;

    if (sheetUrl) {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        docId = match[1];
      }
    }

    const userGidMatch = sheetUrl ? sheetUrl.match(/gid=([0-9]+)/) : null;
    const userGid = userGidMatch ? userGidMatch[1] : null;

    // Fetch gid=0 (Stationed) and gid=1487776310 (Virtual) plus userGid
    const gidsToFetch = Array.from(new Set(["0", "1487776310", ...(userGid ? [userGid] : [])]));

    const sheetMap: Record<string, string> = {};

    // Fetch specific GIDs in parallel (gid=0 for Stationed, gid=1487776310 for Virtual)
    const gidResults = await Promise.all(
      gidsToFetch.map(async (gid) => {
        const text = await fetchGoogleSheetCsv(docId, gid);
        return { gid, text };
      })
    );

    gidResults.forEach((r) => {
      if (r.text) {
        sheetMap[r.gid] = r.text;
      }
    });

    // Fallback to default endpoint if no GID returned data
    if (Object.keys(sheetMap).length === 0) {
      const defaultCsv = await fetchGoogleSheetCsv(docId);
      if (defaultCsv) {
        sheetMap["default"] = defaultCsv;
      }
    }

    // If no data found for custom docId, fallback to primary default docId
    if (Object.keys(sheetMap).length === 0 && docId !== DEFAULT_DOC_ID) {
      docId = DEFAULT_DOC_ID;
      const defaultCsvFallback = await fetchGoogleSheetCsv(DEFAULT_DOC_ID);
      if (defaultCsvFallback) sheetMap["default"] = defaultCsvFallback;

      const fallbackGidResults = await Promise.all(
        ["0", "1487776310"].map(async (gid) => {
          const text = await fetchGoogleSheetCsv(DEFAULT_DOC_ID, gid);
          return { gid, text };
        })
      );
      fallbackGidResults.forEach((r) => {
        if (r.text) sheetMap[r.gid] = r.text;
      });
    }

    const hasData = Object.keys(sheetMap).length > 0;

    res.json({
      success: true,
      docId,
      userGid,
      isRestricted: !hasData,
      sheets: sheetMap,
    });
  } catch (err: any) {
    console.error("Multi sheet sync error:", err);
    res.status(500).json({ error: err?.message || "Failed to sync sheet tabs" });
  }
});

// Mount Vite middleware or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kaizen Team Leader Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
