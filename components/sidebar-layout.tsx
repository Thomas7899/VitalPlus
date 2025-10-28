"use client";

import { useState } from "react";
import {
  User,
  HeartPulse,
  Activity,
  Utensils,
  Menu,
  Scale,
  Bed,
} from "lucide-react";
import { NavLink } from "./nav-link";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div
        className={`fixed top-0 left-0 h-full z-20 w-60 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="w-full h-full flex flex-col">
          <div className="p-6 border-b border-slate-200/50">
            <NavLink href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V+</span>
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800">Vital+</h1>
                <p className="text-sm text-slate-500">Gesundheits-App</p>
              </div>
            </NavLink>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              <NavLink href="/user" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-green-50 hover:text-green-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium">Profil</span>
              </NavLink>

              <NavLink href="/blutdruck" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-purple-50 hover:text-purple-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 transition-colors group-hover:bg-purple-200">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium">Blutdruck</span>
              </NavLink>

              <NavLink href="/kalorien" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 transition-colors group-hover:bg-orange-200">
                  <Utensils className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-medium">Ernährung</span>
              </NavLink>

              <NavLink href="/vitalfunktionen" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 transition-colors group-hover:bg-red-200">
                  <HeartPulse className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-medium">Vitalfunktionen</span>
              </NavLink>

              <NavLink href="/koerperzusammensetzung" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200">
                  <Scale className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">Körper</span>
              </NavLink>

              <NavLink href="/regeneration" className="group flex h-12 items-center rounded-xl px-4 text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 w-full">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 transition-colors group-hover:bg-indigo-200">
                  <Bed className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="font-medium">Regeneration</span>
              </NavLink>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-200/50 text-center text-xs text-slate-400">
            © 2025 Vital+ App
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-10"
        />
      )}

      <main className="flex-1 overflow-auto bg-transparent relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
        )}

        <div className="min-h-full p-8 pt-8">{children}</div>
      </main>
    </div>
  );
}