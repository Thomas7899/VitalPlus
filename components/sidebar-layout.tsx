"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Heart, Activity, Utensils, Menu, X } from "lucide-react";
import Link from "next/link";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Sidebar Toggle */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        variant="outline"
        size="icon"
        className={`absolute top-4 z-50 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? "right-4" : "left-4"
        }`}
        style={{ top: "2.5rem" }}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-58" : "w-0"
        } transition-all duration-300 overflow-hidden flex-shrink-0`}
      >
        <div className="w-58 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20 flex flex-col">
          {/* Logo + Title */}
          <div className="p-6 border-b border-slate-200/50">
            <Link href="/" passHref>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V+</span>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-slate-800">Vital+</h1>
                  <p className="text-sm text-slate-500">Gesundheits-App</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              <Link href="/user" passHref>
                <Button
                  variant="ghost"
                  className="w-full flex justify-start items-center h-12 px-4 text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-medium">Profil</span>
                </Button>
              </Link>

              <Link href="/gesundheit" passHref>
                <Button
                  variant="ghost"
                  className="w-full flex justify-start items-center h-12 px-4 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="font-medium">Gesundheit</span>
                </Button>
              </Link>

              <Link href="/blutdruck" passHref>
                <Button
                  variant="ghost"
                  className="w-full flex justify-start items-center h-12 px-4 text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Blutdruck</span>
                </Button>
              </Link>

              <Link href="/kalorien" passHref>
                <Button
                  variant="ghost"
                  className="w-full flex justify-start items-center h-12 px-4 text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                    <Utensils className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="font-medium">Ernährung</span>
                </Button>
              </Link>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200/50">
            <div className="text-center text-xs text-slate-400">
              © 2025 Vital+ App
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-transparent">
        <div className="min-h-full p-8 pt-20">{children}</div>
      </main>
    </div>
  );
}