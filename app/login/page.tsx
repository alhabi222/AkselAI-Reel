'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, AuthProvider } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/toaster';


const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

function LoginPageContent() {
  const { login, isInitialized } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isLoading = form.formState.isSubmitting || !isInitialized;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await login(values.email, values.password);
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred during login.';
      if (err.message.includes('auth/invalid-credential')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message.includes('auth/configuration-not-found')) {
        errorMessage = 'Authentication service is not enabled for this project. Please enable Email/Password sign-in in your Firebase Console.';
      } else if (err.message.includes('Firebase is not configured')) {
        errorMessage = 'Firebase is not configured. Please check your API keys in the src/lib/firebase-config.ts file.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  }

  const getButtonText = () => {
    if (!isInitialized) return 'Inisialisasi...';
    if (form.formState.isSubmitting) return 'Logging in...';
    return 'Login';
  }

  return (
    <>
      <div className="flex flex-col h-screen">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {getButtonText()}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            Don&apos;t have an account?&nbsp;
            <Link href="/register" className="underline">
              Register
            </Link>
          </CardFooter>
        </Card>
      </div>
      </div>
    </>
  );
}


export default function LoginPage() {
  return (
    <AuthProvider>
      <Toaster />
      <LoginPageContent />
    </AuthProvider>
  )
}
