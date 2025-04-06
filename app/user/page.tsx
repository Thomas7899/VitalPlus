"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail"),
});

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editUser, setEditUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const handleEdit = (user: any) => {
    setName(user.name);
    setEmail(user.email);
    setEditUser(user);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">User Verwaltung</h1>
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded shadow-md max-w-lg mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <Button type="submit" className="w-full">
          {editUser ? "User aktualisieren" : "User hinzufügen"}
        </Button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Alle User</h2>
      <ul className="space-y-4">
        {users.map((user: any) => (
          <li key={user.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-md">
            <span>{user.name} ({user.email})</span>
            <div>
              <Button className="mr-2 bg-yellow-500 text-white" onClick={() => handleEdit(user)}>
                Edit
              </Button>
              <Button className="bg-red-500 text-white" onClick={() => handleDelete(user.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
