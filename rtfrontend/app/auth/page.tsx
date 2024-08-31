"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5252";
    const endpoint = isLogin ? `${apiBaseUrl}/api/User/Login` : `${apiBaseUrl}/api/User/Register`;
    
    const requestBody = isLogin
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      const data = await response.json();
      console.log("Success:", data);

      if (isLogin && data.token) {
        // Store the token in localStorage
        localStorage.setItem("authToken", data.token);
      }

      // Redirect to home page
      router.push("/home");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }
  };


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="flex w-full md:w-1/2 bg-[#121212] text-white items-center justify-center">
        <h2 className="text-4xl font-bold hidden md:block">
          {isLogin ? "Welcome Back!" : "Join Us Today!"}
        </h2>
      </div>

      <div className="flex w-full md:w-1/2 bg-background dark:bg-none items-center justify-center flex-grow min-h-screen">
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            {isLogin ? "Login to Your Account" : "Create a New Account"}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required={!isLogin}
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
                />
              </div>
            )}

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
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>

          {isLogin && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Forgot your password?{" "}
              <button
                onClick={() => router.push("/forgot-password")}
                className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                Reset Password
              </button>
            </p>
          )}

          {message && (
            <p className="text-center text-red-500 mt-4">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
