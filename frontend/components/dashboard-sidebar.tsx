"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  UserPlus,
  Layers,
  User,
  BookText,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserRole } from "@/types/user";
import { useAppSelector } from "@/store/hooks";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAppSelector((state) => state.authReducer);
  console.log(user);

  const navigation = [
    {
      name: "Courses",
      href: "/dashboard",
      icon: BookOpen,
      roles: ["admin", "faculty", "student"],
    },
    {
      name: "Tests",
      href: "/dashboard/tests",
      icon: ClipboardList,
      roles: ["admin", "faculty", "student"],
    },
    {
      name: "Assignments",
      href: "/dashboard/assignments",
      icon: FileText,
      roles: ["admin", "faculty", "student"],
    },
    {
      name: "Learners",
      href: "/dashboard/manage/learners",
      icon: Users,
      roles: ["admin", "faculty"],
    },
    {
      name: "Batches",
      href: "/dashboard/manage/batches",
      icon: Layers,
      roles: ["admin"],
    },
    {
      name: "Faculties",
      href: "/dashboard/manage/faculties",
      icon: UserPlus,
      roles: ["admin"],
    },
    {
      name: "Subjects",
      href: "/dashboard/manage/subjects",
      icon: BookText,
      roles: ["admin"],
    },
    {
      name: "Users",
      href: "/dashboard/manage/users",
      icon: User,
      roles: ["admin"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const roleLabels = {
    admin: "Admin",
    faculty: "Faculty",
    student: "Student",
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-destructive";
      case "faculty":
        return "bg-primary";
      case "student":
        return "bg-secondary";
      default:
        return "bg-primary";
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-slate-900 via-blue-900 to-purple-900 text-white border-r border-white/10 transition-transform duration-300 ease-in-out",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">LMS Dashboard</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={toggleMobileMenu}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center px-4 py-4 border-b border-white/10 bg-white/5">
            <Avatar className="h-10 w-10">
              {/* <AvatarImage src="/placeholder.svg" alt="User" /> */}
              <AvatarFallback
                className={`${getRoleColor(
                  user?.role ?? "student"
                )} text-primary-foreground`}
              >
                {(user?.first_name?.charAt(0) ?? "").toUpperCase() +
                  (user?.last_name?.charAt(0) ?? "").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white capitalize">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-300">
                {roleLabels[user?.role ?? "student"]}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <div key={item.name} className="relative">
                  {/* Active Dot Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full shadow-lg shadow-blue-500/50"></div>
                  )}

                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg border-l-2 border-transparent ml-1"
                        : "text-gray-300 hover:text-white hover:bg-white/10 ml-1"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4",
                        isActive ? "text-blue-300" : ""
                      )}
                    />
                    <span className={isActive ? "font-semibold" : ""}>
                      {item.name}
                    </span>

                    {/* Additional glow effect for active item */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-md blur-sm -z-10"></div>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full border-white/20 text-black hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
              asChild
            >
              <Link href="/">Sign Out</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/80 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}
