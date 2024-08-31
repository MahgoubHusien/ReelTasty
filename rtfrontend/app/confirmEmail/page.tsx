"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ConfirmEmailPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const code = urlParams.get("code");

    const confirmEmail = async () => {
      if (!userId || !code) {
        setMessage("Invalid user ID or confirmation code.");
        return;
      }

      try {
        const response = await fetch(`/api/User/ConfirmEmail?userId=${userId}&code=${code}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Error confirming email.");
        }

        setMessage("Email confirmed successfully.");
      } catch (error) {
        if (error instanceof Error) {
            setMessage(error.message);
          } else {
            setMessage("An unexpected error occurred.");
          }
      }
    };

    confirmEmail();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center">Email Confirmation</h2>
        <p className="mt-4 text-center">{message}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
