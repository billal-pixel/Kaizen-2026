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

// Proxy route to fetch public Google Sheet CSV content
app.get("/api/sheets-proxy", async (req, res) => {
  try {
    const sheetUrl = (req.query.url as string) || "";
    const customGid = req.query.gid as string;

    if (!sheetUrl) {
      return res.status(400).json({ error: "Missing sheet URL" });
    }

    // Convert standard Google Sheet edit link to CSV export link if needed
    let csvUrl = sheetUrl;
    if (sheetUrl.includes("docs.google.com/spreadsheets")) {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      if (match && match[1]) {
        const docId = match[1];
        const gid = customGid || (gidMatch ? gidMatch[1] : "0");
        csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      }
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
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
    if (!sheetUrl) {
      return res.status(400).json({ error: "Missing sheet URL" });
    }

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return res.status(400).json({ error: "Invalid Google Sheet link" });
    }

    const docId = match[1];
    const userGidMatch = sheetUrl.match(/gid=([0-9]+)/);
    const userGid = userGidMatch ? userGidMatch[1] : null;

    // Fetch gid=0 (Stationed) and gid=1487776310 (Virtual) in parallel
    const gidsToFetch = Array.from(new Set(["0", "1487776310", ...(userGid ? [userGid] : [])]));

    const fetchPromises = gidsToFetch.map(async (gid) => {
      const url = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) return { gid, text: null };
        const text = await resp.text();
        return { gid, text };
      } catch {
        return { gid, text: null };
      }
    });

    const results = await Promise.all(fetchPromises);
    const sheetMap: Record<string, string> = {};
    let isRestricted = false;

    results.forEach((r) => {
      if (r.text) {
        if (r.text.includes("<!DOCTYPE html>") || r.text.includes("document-root") || r.text.includes("sign-in") || r.text.includes("ServiceLogin")) {
          isRestricted = true;
        } else {
          sheetMap[r.gid] = r.text;
        }
      }
    });

    res.json({
      success: true,
      docId,
      userGid,
      isRestricted,
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
