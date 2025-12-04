# ⚡ Gisty — AI Page Summarizer (Chrome Extension)
Gisty is a minimalist, privacy-first Chrome extension that turns any webpage into clean, actionable **bullet-point summaries—instantly.**  
Powered by Gemini 2.5 Flash Lite, built with a focus on speed, clarity, and zero data retention.  

🔗 **Landing Page:** https://gisty.sagarsaini.com
👉 **Author:** [Sagar Saini](https://sagarsaini.com)


## ✨ Features

### ⚡ One-Click Summaries
Click the extension icon → get real-time bullet-point summaries of any webpage.  
### 🖱️ Context Menu Support
Highlight → Right-click → **Summarize with Gisty**  
Perfect for summarizing selected paragraphs.  
### 🎭 Multiple Summary Styles
Choose your tone:  
- **Professional**  
- **Academic**  
- **News**  
- **Casual**  
- **Story**  
- **Sarcastic**  
- **ELI5** (Explain Like I'm 5)

### 🌓 Auto Theme Detection
The popup UI and overlay follow your system theme:  
✔ Light mode  
✔ Dark mode  

### 📋 One-Click Copy
Copy formatted bullet points directly to:  
- Notion  
- Slack  
- Docs  
- Email  
- Issue trackers
-  
### 🚀 Real-Time Streaming
Summaries stream chunk-by-chunk for instant feedback using Gemini’s streaming API.  

### 🔒 Privacy-First  
Gisty stores zero data:  
- No browsing data  
- No inputs  
- No summaries  
- No logs  
- No tracking  


## 🛠️ Tech Stack
- Manifest v3 Chrome Extension  
- Lucide Icons  
- Node.js + Express backend  
- Gemini 2.5 Flash Lite API  


## 📦 Local Development
1. Clone the repo
```bash
git clone https://github.com/<your-username>/gisty.git
cd gisty-extension
```  
2. Install and run the backend server
```bash  
cd server
npm install
npm run dev
```  
**Backend runs on:** http://localhost:3000  

3. Load the Chrome Extension  
- Go to chrome://extensions  
- Enable Developer mode  
- Click Load unpacked  
- Select the client/ directory  


## 🤝 Contributing
Want to add:  
- Better UI  
- New summary styles  
- Faster overlay  
- Accessibility upgrades  
PRs are welcome!


## ⭐ Support
If Gisty saves you time, **consider starring the repo!**
