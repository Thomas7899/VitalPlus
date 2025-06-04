import { useEffect, useState } from "react";

type User = {
  id: string;
  name?: string;
  email: string;
};

export function useUsers() {
  const [data, setData] = useState<User[]>([]); 
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Fehler beim Laden der Nutzer");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return {
    data,
    error,
    isLoading,
  };
}
