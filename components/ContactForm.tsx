"use client";

import { useState } from "react";

interface ContactFormProps {
  potterId: string;
  potterName: string;
  potterSlug: string;
  courseId: string | null;
  courseTitle: string | null;
}

export function ContactForm({ potterId, potterName, potterSlug, courseId, courseTitle }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      potterId,
      potterSlug,
      courseId,
      courseTitle,
      senderName: formData.get("name"),
      senderEmail: formData.get("email"),
      message: formData.get("message"),
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-lg bg-green-50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-green-800">Message sent!</p>
        <p className="mt-2 text-sm text-green-700">
          {potterName} will be in touch with you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {courseTitle && (
        <div className="rounded-lg bg-clay-50 border border-clay-200 px-4 py-3 text-sm text-clay-800">
          Enquiring about: <span className="font-medium">{courseTitle}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">Your name</label>
        <input id="name" name="name" type="text" required className="input-field" placeholder="Jane Smith" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">Your email</label>
        <input id="email" name="email" type="email" required className="input-field" placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="input-field resize-y"
          placeholder={courseTitle
            ? `Hi, I'm interested in your ${courseTitle} course and would love to know more…`
            : "Hello, I'd like to get in touch about…"}
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
