import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// TODO: LLM compile + AST validation w/ repair-retry
app.post("/api/compile", (req, res) => {
  const { rawEvents } = req.body ?? {};
  if (!Array.isArray(rawEvents))
    return res.status(400).json({ error: "rawEvents must be an array" });
  res.json({ workflowName: "untitled", description: "stub AST", steps: [] });
});

app.listen(Number(process.env.PORT ?? 3000), () => console.log("ezer server on :3000"));
