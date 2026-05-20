"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SetupForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("Junior");
  const [techstack, setTechstack] = useState("");
  const [type, setType] = useState("Mixed");
  const [amount, setAmount] = useState(3);
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resumeText = "";
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          resumeText = data.text;
        } else {
          console.error("Resume upload failed");
        }
      }

      const generateRes = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          level,
          techstack,
          type,
          amount,
          userid: userId,
          jdText,
          resumeText,
        }),
      });

      if (generateRes.ok) {
        const data = await generateRes.json();
        if (data.id) {
          router.push(`/interview/${data.id}`);
        }
      } else {
        console.error("Failed to generate interview");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-2xl bg-dark/50 backdrop-blur-sm border border-light-200/10 rounded-2xl p-8 mt-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-light-200/80">Job Role (e.g. Frontend Developer)</label>
        <input 
          required
          type="text" 
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-transparent border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-light-200/80">Experience Level</label>
          <select 
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-dark border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple"
          >
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-light-200/80">Interview Type</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-dark border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple"
          >
            <option value="Behavioral">Behavioral</option>
            <option value="Technical">Technical</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-light-200/80">Tech Stack (comma separated)</label>
        <input 
          type="text" 
          value={techstack}
          onChange={(e) => setTechstack(e.target.value)}
          placeholder="React, Next.js, TypeScript"
          className="bg-transparent border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-light-200/80">Amount of Questions (Max 5)</label>
        <input 
          required
          type="number" 
          min="1"
          max="5"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="bg-transparent border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple"
        />
      </div>

      <div className="border-t border-light-200/10 my-2 pt-4">
        <h3 className="text-lg font-bold text-white mb-4">Tailor Your Interview</h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-light-200/80">Job Description (Optional)</label>
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here..."
              rows={4}
              className="bg-transparent border border-light-200/20 rounded-lg p-3 text-white focus:outline-none focus:border-primary-purple resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-light-200/80">Upload Resume (PDF only)</label>
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-purple/20 file:text-primary-purple hover:file:bg-primary-purple/30"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-4 bg-primary-purple hover:bg-primary-purple/80 text-white font-bold py-3 rounded-lg">
        {loading ? "Generating Interview..." : "Generate Interview"}
      </Button>
    </form>
  );
}
