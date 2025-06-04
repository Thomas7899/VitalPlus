"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";

type User = {
  id: string;
  name: string;
  email: string;
};

const userSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail"),
});

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = userSchema.safeParse({ name, email });

    if (!result.success) {
      const newErrors: { [key: string]: string } = {};
      result.error.errors.forEach((error) => {
        newErrors[error.path[0]] = error.message;
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const method = editUser ? "PUT" : "POST";
    const res = await fetch("/api/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, ...(editUser ? { id: editUser.id } : {}) }),
    });

    if (res.ok) {
      setName("");
      setEmail("");
      setEditUser(null);
      const updated = await fetch("/api/users").then((res) => res.json());
      setUsers(updated);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      const updated = await fetch("/api/users").then((res) => res.json());
      setUsers(updated);
    }
  };

  const handleEdit = (user: User) => {
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setEditUser(user); // wichtig!
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">User Verwaltung</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-6 bg-white rounded shadow-md max-w-lg mx-auto"
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">E-Mail</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <Button type="submit">{editUser ? "Aktualisieren" : "Erstellen"}</Button>
      </form>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Benutzerliste</h2>
        <ul className="space-y-4">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center bg-gray-100 p-4 rounded shadow-sm">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(user)}>Bearbeiten</Button>
                <Button variant="destructive" onClick={() => handleDelete(user.id)}>Löschen</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
