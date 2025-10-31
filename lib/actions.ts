'use server';

import { signIn } from '@/app/api/auth/[...nextauth]/route';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);

    const redirectTo = formData.get('redirectTo')?.toString() || '/';
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
