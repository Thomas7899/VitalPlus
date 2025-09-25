"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Utensils, TrendingUp, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const quickStats = [
    { title: "Heutige Schritte", value: "8,247", change: "+12%", color: "blue" },
    { title: "Kalorienverbrauch", value: "2,150", change: "+5%", color: "orange" },
    { title: "Herzfrequenz", value: "72 bpm", change: "Normal", color: "red" },
    { title: "Schlafqualität", value: "7.5h", change: "+0.5h", color: "purple" },
  ];

  const quickActions = [
    {
      title: "Blutdruck messen",
      description: "Neue Messung hinzufügen",
      icon: Activity,
      href: "/blutdruck",
      color: "purple"
    },
    {
      title: "Mahlzeit eingeben",
      description: "Kalorien tracken",
      icon: Utensils,
      href: "/kalorien", 
      color: "orange"
    },
    {
      title: "Gesundheitsdaten",
      description: "Alle Werte anzeigen",
      icon: Heart,
      href: "/gesundheit",
      color: "red"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Willkommen zurück!
        </h1>
        <p className="text-slate-600 text-lg">
          Hier ist deine Gesundheitsübersicht für heute
        </p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className={`text-sm ${stat.change.includes('+') ? 'text-green-600' : 'text-slate-500'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  stat.color === 'blue' ? 'from-blue-400 to-blue-600' :
                  stat.color === 'orange' ? 'from-orange-400 to-orange-600' :
                  stat.color === 'red' ? 'from-red-400 to-red-600' :
                  'from-purple-400 to-purple-600'
                } flex items-center justify-center`}>
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schnellzugriff */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Schnellzugriff</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                    action.color === 'purple' ? 'from-purple-400 to-purple-600' :
                    action.color === 'orange' ? 'from-orange-400 to-orange-600' :
                    'from-red-400 to-red-600'
                  } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Aktivitäten */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Calendar className="mr-2 h-5 w-5" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">Blutdruck gemessen</p>
                <p className="text-sm text-slate-600">120/80 mmHg - vor 2 Stunden</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Utensils className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">Mittagessen erfasst</p>
                <p className="text-sm text-slate-600">650 Kalorien - vor 3 Stunden</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}