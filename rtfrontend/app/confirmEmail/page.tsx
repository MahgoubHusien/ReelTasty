"use client";

import React from "react";
import { useRouter } from "next/navigation";

const ConfirmPage: React.FC = () => {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push("/auth?view=login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-lg p-8 bg-white shadow-lg rounded-lg text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h2>
        <p className="text-gray-600 mb-6">
          Please check your email for confirmation and then click login.
        </p>

        <button
          onClick={handleLoginRedirect}
          className="py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default ConfirmPage;
