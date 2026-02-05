"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { loadUserFromStorage } from "@/store/auth";
import DashboardSidebar from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
