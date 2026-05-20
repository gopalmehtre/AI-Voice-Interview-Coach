import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      {/* ATS Score Section */}
      {feedback?.atsScore != null && (
        <div className="flex flex-col gap-4 mt-6 p-6 rounded-2xl border border-light-200/10 bg-dark/50">
          <h2 className="text-2xl font-semibold">📊 ATS Compatibility Score</h2>
          <div className="flex items-center gap-4">
            <div className="w-full bg-dark-200 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${feedback.atsScore}%`,
                  background:
                    feedback.atsScore >= 75
                      ? "linear-gradient(90deg, #22c55e, #16a34a)"
                      : feedback.atsScore >= 50
                      ? "linear-gradient(90deg, #eab308, #f59e0b)"
                      : "linear-gradient(90deg, #ef4444, #dc2626)",
                }}
              />
            </div>
            <span className="text-2xl font-bold text-primary-200 min-w-[60px]">
              {feedback.atsScore}/100
            </span>
          </div>
          <p className="text-sm text-light-200/60">
            {feedback.atsScore >= 75
              ? "Your resume is well-optimized for ATS systems."
              : feedback.atsScore >= 50
              ? "Your resume needs some improvements to pass ATS filters reliably."
              : "Your resume may be filtered out by most ATS systems. Consider the suggestions below."}
          </p>
        </div>
      )}

      {/* Resume Tailoring Suggestions */}
      {feedback?.resumeSuggestions && feedback.resumeSuggestions.length > 0 && (
        <div className="flex flex-col gap-3 mt-6 p-6 rounded-2xl border border-light-200/10 bg-dark/50">
          <h2 className="text-2xl font-semibold">✏️ Resume Tailoring Suggestions</h2>
          <ul className="flex flex-col gap-2">
            {feedback.resumeSuggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary-200 mt-1">▸</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Job Roles */}
      {feedback?.jobSuggestions && feedback.jobSuggestions.length > 0 && (
        <div className="flex flex-col gap-3 mt-6 p-6 rounded-2xl border border-light-200/10 bg-dark/50">
          <h2 className="text-2xl font-semibold">💼 Suggested Job Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedback.jobSuggestions.map((job: { title: string; reason: string }, index: number) => (
              <div key={index} className="p-4 rounded-xl border border-light-200/10 bg-dark-200/50">
                <p className="font-bold text-primary-200">{job.title}</p>
                <p className="text-sm text-light-200/70 mt-1">{job.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
