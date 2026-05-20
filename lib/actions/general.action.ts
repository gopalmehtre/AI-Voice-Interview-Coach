"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/constants";

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const prompt = `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        
        Return ONLY a valid JSON object matching this exact structure:
        {
          "totalScore": 85,
          "categoryScores": [
            { "name": "Communication Skills", "score": 80, "comment": "..." },
            { "name": "Technical Knowledge", "score": 90, "comment": "..." },
            { "name": "Problem Solving", "score": 85, "comment": "..." },
            { "name": "Cultural Fit", "score": 85, "comment": "..." },
            { "name": "Confidence and Clarity", "score": 80, "comment": "..." }
          ],
          "strengths": ["...", "..."],
          "areasForImprovement": ["...", "..."],
          "finalAssessment": "..."
        }
        `;
    const system = "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. You must respond with raw JSON only.";

    let object;
    try {
      const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt,
        system,
      });
      // Try to strip any markdown formatting before parsing
      const jsonStr = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
      object = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Gemini failed, falling back to Groq:", e);
      const result = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
        system,
      });
      const jsonStr = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
      object = JSON.parse(jsonStr);
    }

    const feedbackData: any = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
    };

    // --- ATS Score, Resume Tailoring, Job Suggestions ---
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { resumeText: true, jdText: true, role: true },
    });

    if (interview?.resumeText || interview?.jdText) {
      const atsPrompt = `
You are an expert ATS (Applicant Tracking System) analyzer and career advisor.

${interview.resumeText ? `Here is the candidate's Resume:\n${interview.resumeText}\n` : ""}
${interview.jdText ? `Here is the Job Description:\n${interview.jdText}\n` : ""}
${interview.role ? `The target role is: ${interview.role}` : ""}

Analyze the resume${interview.jdText ? " against the job description" : ""} and return ONLY a valid JSON object with this exact structure:
{
  "atsScore": 75,
  "resumeSuggestions": [
    "Add more quantifiable achievements to your work experience",
    "Include relevant keywords like ...",
    "Restructure your summary to highlight ..."
  ],
  "jobSuggestions": [
    { "title": "Frontend Developer", "reason": "Your React and TypeScript skills align well" },
    { "title": "Full Stack Engineer", "reason": "Your experience with Node.js and databases qualifies you" },
    { "title": "UI Engineer", "reason": "Your CSS and design system knowledge is strong" }
  ]
}

Rules:
- atsScore is 0-100 based on how well the resume matches${interview.jdText ? " the JD" : " a typical job in the target role"}.
- resumeSuggestions: Give 3-5 actionable, specific suggestions to improve the resume.
- jobSuggestions: Suggest 3-5 job roles the candidate is best suited for based on their resume skills. Each must have a title and a one-sentence reason.
- Return raw JSON only, no markdown.
`;

      try {
        let atsObject;
        try {
          const atsResult = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: atsPrompt,
            system: "You are an expert ATS analyzer and career advisor. Respond with raw JSON only.",
          });
          const atsJson = atsResult.text.replace(/```json/g, "").replace(/```/g, "").trim();
          atsObject = JSON.parse(atsJson);
        } catch (e) {
          console.warn("Gemini ATS failed, falling back to Groq:", e);
          const atsResult = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt: atsPrompt,
            system: "You are an expert ATS analyzer and career advisor. Respond with raw JSON only.",
          });
          const atsJson = atsResult.text.replace(/```json/g, "").replace(/```/g, "").trim();
          atsObject = JSON.parse(atsJson);
        }

        feedbackData.atsScore = atsObject.atsScore;
        feedbackData.resumeSuggestions = atsObject.resumeSuggestions;
        feedbackData.jobSuggestions = atsObject.jobSuggestions;
      } catch (atsError) {
        console.error("Error generating ATS analysis:", atsError);
        // Continue without ATS data — the core feedback is still saved
      }
    }

    let feedback;

    if (feedbackId) {
      feedback = await prisma.feedback.upsert({
        where: { id: feedbackId },
        update: feedbackData,
        create: { id: feedbackId, ...feedbackData },
      });
    } else {
      feedback = await prisma.feedback.create({
        data: feedbackData,
      });
    }

    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await prisma.interview.findUnique({
    where: { id },
  });

  if (!interview) return null;

  return {
    id: interview.id,
    role: interview.role,
    type: interview.type,
    level: interview.level,
    techstack: interview.techstack,
    questions: interview.questions,
    userId: interview.userId,
    finalized: interview.finalized,
    createdAt: interview.createdAt.toISOString(),
  };
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const feedback = await prisma.feedback.findFirst({
    where: { interviewId, userId },
  });

  if (!feedback) return null;

  return {
    id: feedback.id,
    interviewId: feedback.interviewId,
    totalScore: feedback.totalScore,
    categoryScores: feedback.categoryScores as Feedback["categoryScores"],
    strengths: feedback.strengths as string[],
    areasForImprovement: feedback.areasForImprovement as string[],
    finalAssessment: feedback.finalAssessment,
    atsScore: feedback.atsScore,
    resumeSuggestions: feedback.resumeSuggestions as string[] | null,
    jobSuggestions: feedback.jobSuggestions as { title: string; reason: string }[] | null,
    createdAt: feedback.createdAt.toISOString(),
  };
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await prisma.interview.findMany({
    where: {
      finalized: true,
      userId: { not: userId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return interviews.map((interview) => ({
    id: interview.id,
    role: interview.role,
    type: interview.type,
    level: interview.level,
    techstack: interview.techstack,
    questions: interview.questions,
    userId: interview.userId,
    finalized: interview.finalized,
    createdAt: interview.createdAt.toISOString(),
  }));
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return interviews.map((interview) => ({
    id: interview.id,
    role: interview.role,
    type: interview.type,
    level: interview.level,
    techstack: interview.techstack,
    questions: interview.questions,
    userId: interview.userId,
    finalized: interview.finalized,
    createdAt: interview.createdAt.toISOString(),
  }));
}
