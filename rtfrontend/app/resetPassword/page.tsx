"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const code = urlParams.get("code");

    if (!email || !code) {
      setMessage("Invalid email or reset code.");
      return;
    }

    try {
      const response = await fetch("/api/User/ResetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, code }),
      });

      if (!response.ok) {
        throw new Error("Error resetting password.");
      }

      setMessage("Password reset successfully.");
      router.push("/login");
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
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

export default ResetPasswordPage;
