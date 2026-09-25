# CV-Rank — AI Candidate Evaluation & Ranking System

<img width="1900" height="875" alt="image" src="https://github.com/user-attachments/assets/15fe2a87-a692-46b4-afe5-6fbef49d673e" />

**CV-Rank** is an intelligent candidate screening application designed for hiring managers and recruiters. It analyzes candidate PDF resumes against job descriptions using a modern hybrid AI pipeline:

- **OpenRouter AI (GPT-4o-mini)**: Extracts job requirements, analyzes candidate qualifications, identifies missing skills, and pulls direct evidence from resumes.
- **Local Hugging Face Embeddings**: Computes semantic similarity between job requirements and candidate resume sections locally.
- **Deterministic Python Engine**: Calculates objective, transparent weighted scores and candidate rankings.

> **Note for Hiring Managers**: CV-Rank is an advisory decision-support tool. It presents clear evidence and reasoning for human review and does not make autonomous hiring decisions.

---

## 🚀 Quick Start Guide 

Follow these simple steps to set up and run CV-Rank on your computer.

### 📋 Prerequisites

Before starting, ensure you have:
1. **Docker Desktop** installed and running on your computer. ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))
2. **An OpenRouter API Key** (Instructions below).

---

### Step 1: Get an OpenRouter API Key

OpenRouter provides access to AI models for resume analysis.

1. Go to **[OpenRouter.ai](https://openrouter.ai/)** and sign up for a free account (or log in).
2. Click on your profile or visit **[openrouter.ai/keys](https://openrouter.ai/keys)**.
3. Click **"Create Key"**, give it a name (e.g., `CV-Rank`), and copy the generated key.
   * *Your key will look like: `sk-or-v1-abcdef123456789...`*

---

### Step 2: Configure Your Environment File (`.env`)

1. Create a copy of `.env.example` named `.env` (or `.env.local`):
   - **Using Terminal**:
     - **Windows (Command Prompt / PowerShell)**:
       ```cmd
       copy .env.example .env
       ```
     - **Mac / Linux**:
       ```bash
       cp .env.example .env
       ```
   - **Manual Copy (If command line copy doesn't work)**:
     - Open File Explorer (Windows) or Finder (Mac) in the `CV-Rank` project folder.
     - Copy `.env.example` and paste it in the same directory.
     - Rename the new file to `.env` (or `.env.local`). *(Note: On Windows, make sure hidden files and file extensions are visible if `.env` does not show up)*.
2. Open the newly created `.env` (or `.env.local`) file in Notepad, TextEdit, VS Code, or any text editor.
3. Find the line `AI_API_KEY=` and paste your OpenRouter key after the equals sign:
   ```env
   AI_API_KEY=sk-or-v1-your-actual-openrouter-key-here
   ```
4. Save and close the file.

---

### Step 3: Start the Application (`docker compose up`)

1. Make sure **Docker Desktop** is open and running on your computer.
2. In your terminal, run the following command to start CV-Rank:

   ```bash
   docker compose up --build
   ```

3. Wait a few moments while Docker builds and starts the application.
4. Once ready, open your web browser (Chrome, Edge, Safari, or Firefox) and visit:

   👉 **[http://localhost:3000](http://localhost:3000)**

---

### Step 4: Stop the Application (`docker compose down`)

When you are done using CV-Rank:

1. In your terminal window where Docker is running, press **`Ctrl + C`** to stop the process.
2. To shut down the containers completely and prepare for a clean session next time, run:

   ```bash
   docker compose down
   ```

> **💡 What does `docker compose down` do?**  
> Running `docker compose down` removes temporary application containers. On your next `docker compose up`, CV-Rank will start fresh with default seed data, clearing temporary candidate files from previous testing sessions.

---

## 🛠️ Common Troubleshooting

- **"Docker is not running or command not found"**:  
  Make sure Docker Desktop is launched and the whale icon is visible in your system tray or taskbar.
- **"Cannot copy or find `.env` file"**:  
  If terminal copy commands (`copy` / `cp`) fail or behave unexpectedly, simply copy `.env.example` manually in File Explorer or Finder, and rename it to `.env` (or `.env.local`). On Windows, ensure hidden files and file extensions are turned on in File Explorer View settings.
- **"AI Key or Service Unavailable Error"**:  
  Check your `.env` (or `.env.local`) file to confirm `AI_API_KEY` is pasted correctly without extra spaces or quotes. You can verify key status anytime on the **Developer Options** page in the application.
- **"Port 3000 is already in use"**:  
  Close any other applications running on port 3000 or restart Docker Desktop.

---

## 📚 Documentation & Technical References

For developers and detailed specifications:

- 📖 **[User Manual](docs/USER_MANUAL.md)** — Comprehensive step-by-step user guide for hiring managers.
- 📐 **[Product Specification (SPEC.md)](SPEC.md)** — Architectural design and detailed scoring algorithm formula.
- 🏗️ **[System Architecture](docs/ARCHITECTURE.md)** — Component breakdown, hybrid AI boundaries, and data flow.
- 💻 **[Developer Guide](docs/DEVELOPER_GUIDE.md)** — Local setup, testing, and backend development instructions.
- ⚙️ **[Environment Variables](docs/ENVIRONMENT.md)** — Complete reference for all `.env` options.
- 📋 **[Implemented Features](docs/FEATURES.md)** — List of supported capabilities and exclusions.

---

## 📄 License

CV-Rank is provided as open source software under the standard project license.
