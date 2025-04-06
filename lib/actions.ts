"use server";

import { prisma } from "@/lib/prisma";

/* ===================== MITARBEITER ===================== */

// Alle Mitarbeiter abrufen
export async function getMitarbeiter() {
  return await prisma.mitarbeiter.findMany();
}

// Neuen Mitarbeiter hinzufügen
export async function addMitarbeiter(name: string, email: string, position: string) {
  try {
    return await prisma.mitarbeiter.create({ data: { name, email, position } });
  } catch (error) {
    throw new Error("Failed to add mitarbeiter");
  }
}

// Mitarbeiter aktualisieren
export async function updateMitarbeiter(id: string, name: string, email: string, position: string) {
  try {
    return await prisma.mitarbeiter.update({
      where: { id },
      data: { name, email, position },
    });
  } catch (error) {
    throw new Error("Failed to update mitarbeiter");
  }
}

// Mitarbeiter löschen
export async function deleteMitarbeiter(id: string) {
  try {
    await prisma.mitarbeiter.delete({ where: { id } });
    return { message: "Mitarbeiter deleted successfully" };
  } catch (error) {
    throw new Error("Failed to delete mitarbeiter");
  }
}

/* ===================== STUDENTEN ===================== */

export async function getStudents() {
    return await prisma.student.findMany();
  }
  
  export async function addStudent(name: string, email: string) {
    return await prisma.student.create({ data: { name, email } });
  }
  
  export async function updateStudent(id: string, name: string, email: string) {
    return await prisma.student.update({ where: { id }, data: { name, email } });
  }
  
  export async function deleteStudent(id: string) {
    return await prisma.student.delete({ where: { id } });
  }
  
