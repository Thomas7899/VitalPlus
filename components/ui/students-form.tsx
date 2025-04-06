// components/ui/student-form.tsx

import React, { useState } from "react";
import { Form } from "@/components/ui/form/form";
import { Label } from "@/components/ui/form/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Student } from "@/types"; // Dein Student-Typ

const StudentForm = ({ student, onSave }: { student: Student | null; onSave: (student: Student) => void }) => {
  const [formData, setFormData] = useState<Student>({
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    email: student?.email || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div>
      <h2>{student ? "Student bearbeiten" : "Neuen Studenten hinzufügen"}</h2>
      <Form>
        <Label htmlFor="first_name">Vorname</Label>
        <Input
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
        />
        <Label htmlFor="last_name">Nachname</Label>
        <Input
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
        />
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <Button onClick={handleSubmit}>
          {student ? "Speichern" : "Hinzufügen"}
        </Button>
      </Form>
    </div>
  );
};

export default StudentForm;
