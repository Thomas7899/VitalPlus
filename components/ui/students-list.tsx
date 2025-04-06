// components/ui/student-list.tsx

import React from "react";
import { Table, Button, Tooltip } from "@shadcn/ui";
import { Student } from "../../types";

const StudentList = ({ students }: { students: Student[] }) => {
  const handleEdit = (student: Student) => {
    // Bearbeitungslogik
  };

  return (
    <div>
      <h2>Studentenübersicht</h2>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.first_name} {student.last_name}</td>
              <td>{student.email}</td>
              <td>
                <Tooltip content="Bearbeiten">
                  <Button onClick={() => handleEdit(student)}>Bearbeiten</Button>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default StudentList;
