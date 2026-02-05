"use client";

import dynamic from "next/dynamic";

// Dynamically import AuthForm with SSR disabled to prevent hydration mismatches
const AuthForm = dynamic(() => import("@/components/auth-form"), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800" />
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-6" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen">
      <AuthForm />
    </div>
  );
}
