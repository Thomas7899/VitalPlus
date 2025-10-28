"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const profileSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
  email: z.string().email("Ungültige E-Mail-Adresse."),
  height: z.coerce.number().positive("Größe muss positiv sein.").optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function UserProfilePage() {
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1"; // Feste User-ID

  const { data: user, error, isLoading, mutate: mutateUser } = useSWR(`/api/users?id=${userId}`, fetcher);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      height: 0,
      dateOfBirth: "",
      gender: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        height: user.height || 0,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || "",
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: userId }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren des Profils.");
      }

      toast.success("Profil erfolgreich aktualisiert!");
      mutateUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.");
    }
  }

  if (isLoading) return <div className="container mx-auto p-4 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Fehler beim Laden der Benutzerdaten.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Mein Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geburtsdatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geschlecht</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Bitte auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="männlich">Männlich</SelectItem>
                        <SelectItem value="weiblich">Weiblich</SelectItem>
                        <SelectItem value="divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Größe (in m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
