import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());

app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/summarize", limiter);

app.post("/summarize", async (req, res) => {
  try {
    const { text, length = "medium", style = "professional" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const lengthMap = {
      short: "3 bullet points",
      medium: "5 bullet points",
      long: "8 detailed bullet points",
    };
    const lengthInstruction = lengthMap[length] || lengthMap.medium;

    const styleMap = {
      professional:
        "Professional analyst. Clear, neutral tone. No exaggeration.",
      news: "Objective news journalist. Concise, fact-focused, no opinions.",
      academic:
        "Academic researcher. Formal tone, structured phrasing, clarity prioritized.",
      casual: "Friendly, conversational tone. Easy for anyone to understand.",
      story:
        "Narrative storyteller. Turn the content into a short, engaging mini-story.",
      sarcastic:
        "Sarcastic and humorous. Playfully critical but still factually accurate.",
      eli5: "Explain like I'm 5. Use simple vocabulary and analogies a child would understand.",
    };
    const styleInstruction = styleMap[style] || styleMap.professional;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `
    You are an AI summarization assistant.
    
    Writing Style:
    ${styleInstruction}
    
    Task:
    Summarize the provided text into exactly ${lengthInstruction}.
    The summary MUST follow these rules:
    
    • Output ONLY bullet points, each starting with a hyphen (-).
    • No Markdown, no asterisks, no bold/italic formatting.
    • No introductions ("Here is your summary"), no conclusions.
    • No extra commentary, no warnings.
    • Do not add facts that are not in the original text.
    • Each bullet point must be a complete, meaningful idea.
    
    Text to Summarize (trimmed at 40k chars):
    "${text.slice(0, 40000)}"
        `;

    const result = await model.generateContentStream(prompt);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error("Stream Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate summary" });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Gisty server is running on port ${PORT}`);
});
