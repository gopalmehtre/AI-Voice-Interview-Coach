import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

import { prisma } from "@/lib/db";
import { getRandomInterviewCover } from "@/lib/utils";

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid, jdText, resumeText } = await request.json();

  try {
    let questions;
    const prompt = `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        ${techstack ? `The tech stack used in the job is: ${techstack}.` : ''}
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        
        ${jdText ? `Here is the Job Description:\n${jdText}\n` : ''}
        ${resumeText ? `Here is the candidate's Resume:\n${resumeText}\n\nTailor the questions based on the candidate's experience and the Job Description.` : ''}
        
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `;

    try {
      const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt,
      });
      questions = result.text;
    } catch (e) {
      console.warn("Gemini failed, falling back to Groq:", e);
      const result = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
      });
      questions = result.text;
    }

    const interview = await prisma.interview.create({
      data: {
        role,
        type,
        level,
        techstack: techstack ? techstack.split(",") : [],
        questions: JSON.parse(questions),
        userId: userid,
        finalized: true,
        coverImage: getRandomInterviewCover(),
        jdText,
        resumeText,
      },
    });

    return Response.json({ success: true, id: interview.id }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
