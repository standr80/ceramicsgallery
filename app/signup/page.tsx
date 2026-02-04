"use client";

import { useState } from "react";

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    biography: "",
    website: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production: POST to an API or form service (e.g. Formspree, your backend)
    console.log("Signup submitted:", formData);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-20 px-4">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-semibold text-clay-900">
            Thank you for your interest
          </h1>
          <p className="mt-4 text-stone-600">
            We&apos;ve received your application to join Ceramics Gallery. We&apos;ll
            be in touch shortly.
          </p>
          <a href="/" className="btn-primary mt-8 inline-block">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-clay-900">
          Join as a potter
        </h1>
        <p className="mt-2 text-stone-600">
          Apply to list your work on Ceramics Gallery. We&apos;ll review your
          application and get back to you.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
              Your name / studio name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input-field"
              placeholder="e.g. Fred Bloggs"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="biography" className="block text-sm font-medium text-stone-700 mb-1">
              Short biography
            </label>
            <textarea
              id="biography"
              name="biography"
              rows={4}
              required
              className="input-field resize-y"
              placeholder="Tell us about your practice, influences, and the type of work you make..."
              value={formData.biography}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-stone-700 mb-1">
              Website or social link (optional)
            </label>
            <input
              id="website"
              name="website"
              type="url"
              className="input-field"
              placeholder="https://..."
              value={formData.website}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-1">
              Anything else you&apos;d like to add?
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="input-field resize-y"
              placeholder="e.g. how you heard about us, questions..."
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Submit application
          </button>
        </form>
      </div>
    </div>
  );
}
