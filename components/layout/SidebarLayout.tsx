// components/layout/SidebarLayout.tsx
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
  LogOut,
  ClipboardPlus,
  LayoutDashboard,
  ChevronDown,
  X,
} from "lucide-react";
import { NavLink } from "./NavLink";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div
        className={`fixed top-0 left-0 h-full z-20 w-64 bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-border shadow-xl shadow-slate-200/20 dark:shadow-slate-900/50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <NavLink href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-bold text-lg">V+</span>
              </div>
              <div className="font-normal">
                <h1 className="font-bold text-xl text-foreground">Vital+</h1>
                <p className="text-xs text-muted-foreground">Gesundheits-Tracker</p>
              </div>
            </NavLink>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <nav className="space-y-1">
              {/* Dashboard */}
              <NavLink href="/" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Dashboard</span>
              </NavLink>

              {/* Profil */}
              <NavLink href="/user" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-green-100 dark:group-hover:bg-green-900/30">
                  <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-sm">Profil</span>
              </NavLink>

              {/* Schnell erfassen - Hervorgehoben */}
              <NavLink href="/erfassen" className="group flex h-12 items-center rounded-xl px-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-primary/20 text-foreground transition-all hover:border-primary/40 hover:shadow-md w-full my-2">
                <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-purple-500/20">
                  <ClipboardPlus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm">Schnell erfassen</span>
                  <p className="text-[10px] text-muted-foreground">Alle Daten auf einmal</p>
                </div>
              </NavLink>

              {/* Tracking Section */}
              <div className="pt-3">
                <button
                  onClick={() => setTrackingOpen(!trackingOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  <span>Tracking</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${trackingOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${trackingOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <NavLink href="/blutdruck" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30">
                      <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-sm">Blutdruck</span>
                  </NavLink>

                  <NavLink href="/kalorien" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30">
                      <Utensils className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium text-sm">Ernährung</span>
                  </NavLink>

                  <NavLink href="/vitalfunktionen" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                      <HeartPulse className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-sm">Vitalfunktionen</span>
                  </NavLink>

                  <NavLink href="/koerperzusammensetzung" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                      <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-sm">Körper</span>
                  </NavLink>

                  <NavLink href="/regeneration" className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground w-full">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30">
                      <Bed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium text-sm">Regeneration</span>
                  </NavLink>
                </div>
              </div>
              
              {/* Logout */}
              <div className="pt-3 mt-3 border-t border-border">
                <button
                  onClick={() => signOut()}
                  className="group flex h-11 items-center rounded-xl px-3 text-muted-foreground transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full cursor-pointer"
                >
                  <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-medium text-sm">Abmelden</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">© 2025 Vital+</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-10"
        />
      )}

      <main className="flex-1 overflow-auto bg-transparent relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 p-2.5 rounded-xl bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm border border-border shadow-sm hover:shadow-md hover:bg-secondary transition z-10"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}

        <div className="min-h-full p-6 pt-16 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}