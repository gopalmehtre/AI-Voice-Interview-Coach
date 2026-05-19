"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/constants";

const gemini = createOpenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

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
        model: gemini("gemini-2.0-flash-001"),
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

    const feedbackData = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
    };

    let feedback;

    if (feedbackId) {
      // Update existing feedback
      feedback = await prisma.feedback.upsert({
        where: { id: feedbackId },
        update: feedbackData,
        create: { id: feedbackId, ...feedbackData },
      });
    } else {
      // Create new feedback
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
