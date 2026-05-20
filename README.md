<div align="center">
  <br />
  <div>
    <img src="https://img.shields.io/badge/-Next.JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=black" alt="next.js" />
    <img src="https://img.shields.io/badge/-Vapi_AI-white?style=for-the-badge&color=5dfeca" alt="vapi" />
    <img src="https://img.shields.io/badge/-Google_Gemini-black?style=for-the-badge&logoColor=white&logo=google&color=4285F4" alt="gemini" />
    <img src="https://img.shields.io/badge/-Groq-black?style=for-the-badge&logoColor=white&logo=groq&color=F55036" alt="groq" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="prisma" />
    <img src="https://img.shields.io/badge/-PostgreSQL-black?style=for-the-badge&logoColor=white&logo=postgresql&color=4169E1" alt="postgresql" />
  </div>

  <h1 align="center">Prepwise: AI-Powered Job Interview Coach</h1>
  <p align="center"><strong>A full-stack mock interview platform powered by Voice AI, LLM feedback, and ATS analysis.</strong></p>
</div>

---

## 📋 <a name="table">Table of Contents</a>

1. 🤖 [Introduction](#introduction)
2. 🔋 [Core Features](#features)
3. ⚙️ [Tech Stack](#tech-stack)
4. 🤸 [Quick Start](#quick-start)
5. 📂 [Project Structure](#project-structure)

---

## <a name="introduction">🤖 Introduction</a>

**Prepwise** is a full-stack mock interview platform that combines real-time voice interviews, tailored question generation, and structured AI feedback. Users create an interview based on role, level, and tech stack, then complete a spoken session with a Vapi-powered interviewer. After the call, the app generates an interview report, ATS compatibility score, resume improvement tips, and alternative job role suggestions.

---

## <a name="features">🔋 Core Features</a>

### 🎙️ Real-Time Voice Interviews
Run live interviews with a **Vapi voice agent** that follows a structured script and ends the call automatically when complete.

### 📄 Resume + JD Aware Questioning
Upload a PDF resume or text file and optionally include a job description. The system extracts the content and tailors interview questions to the candidate and role.

### 📝 Structured Feedback & Scoring
Generate a full interview breakdown with category scores, strengths, areas for improvement, and a final assessment.

### 📊 ATS Compatibility Score
Get a $0\text{-}100$ ATS score plus actionable resume optimization suggestions.

### 💼 Job Role Suggestions
Receive alternative role suggestions based on extracted skills and experience from the resume.

### 🔐 JWT Cookie Auth
Authentication is handled with email/password credentials, JWT cookies, and Prisma-backed user records.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

**Frontend**
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 + tailwindcss-animate
- shadcn/ui (Radix primitives)
- React Hook Form + Zod

**Backend & Data**
- Next.js Route Handlers (API routes)
- Prisma ORM + PostgreSQL
- JWT auth + bcrypt password hashing

**AI & Voice**
- Vapi Web SDK for real-time voice interviews
- Google Gemini for question generation and feedback
- Groq (OpenAI-compatible) as fallback model via Vercel AI SDK
- pdf-parse for resume extraction

---

## <a name="quick-start">🤸 Quick Start</a>

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL database
- Vapi account + public web token
- Google Gemini API key
- Groq API key (fallback)

### **1. Clone the Repository**
```bash
git clone <your-repo-url>
cd ai_mock_interviews-main
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
Create a `.env.local` file:

```env
# App
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aimock?schema=public"

# Vapi
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_public_token
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### **4. Initialize the Database**
```bash
npx prisma db push
npx prisma generate
```

### **5. Run the Development Server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## <a name="project-structure">📂 Project Structure</a>

```text
├── app/
│   ├── (auth)/                # Sign in / sign up pages
│   ├── (root)/                # Dashboard, interview setup, feedback
│   ├── api/
│   │   ├── auth/              # JWT auth routes (sign-in, sign-up, sign-out, me)
│   │   ├── upload/            # Resume/text parser (pdf-parse)
│   │   └── vapi/generate/     # Question generation route
│   └── globals.css            # Tailwind styles
├── components/                # UI + feature components (Agent, InterviewCard, SetupForm, etc.)
├── constants/                 # Interview agent config and schemas
├── lib/
│   ├── actions/               # Server actions (auth + feedback)
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # JWT + cookie helpers
│   └── vapi.sdk.ts            # Vapi client
├── prisma/
│   └── schema.prisma          # User, Interview, Feedback models
└── public/                    # Static assets
```
