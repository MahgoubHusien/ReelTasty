"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/User/ForgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Error sending reset email.");
      }

      setMessage("Password reset email sent. Please check your inbox.");
    } catch (error) {
        if (error instanceof Error) {
            setMessage(error.message);
          } else {
            setMessage("An unexpected error occurred.");
          }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Reset Password
          </button>
        </form>
        <p className="mt-4 text-center text-red-500">{message}</p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;