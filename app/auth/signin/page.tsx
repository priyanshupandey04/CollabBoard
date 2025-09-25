"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";

// Shadcn UI Components
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

// Icons and Theme
import { Loader2, AlertTriangle, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Define the form validation schema using Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password cannot be empty." }),
});

export default function SignInPage() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({});

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        // Redirect after successful login
        // Using router.push for a smoother client-side transition
        setIsRedirecting(true);
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if(isRedirecting) return <>
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Redirecting…
    </div>
  </>

  let initalTheme : string | undefined= theme;
  if(!initalTheme) initalTheme = "light";
  return (
    <>
      <div
        className={`relative flex flex-col justify-center items-center min-h-screen overflow-hidden  ${
          initalTheme === "dark"
            ? "bg-radial-[at_100%_90%] from-blue-800  via-black to-black to-90% "
            : " bg-radial-[at_100%_90%] from-blue-900  via-white to-white to-90% "
        }   }`}
      >
        {/* Theme Toggle Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(initalTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="shadow-2xl shadow-black/100 rounded-4xl"
        >
          <Card
            className={`w-[380px] ${
              theme === "dark" ? "bg-gray-950" : "bg-white text-gray-900"
            }`}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Welcome Back! 👋
              </CardTitle>
              <CardDescription>
                Sign in to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Display backend error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Login Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            {...field}
                            disabled={isLoading}
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
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className={`w-full ${
                      theme === "dark" ? "bg-white" : "bg-black text-white"
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <span
                  onClick={() => {
                    if (isLoading) return;
                    router.push("/auth/signup");
                  }}
                  className={`text-primary hover:underline ${
                    isLoading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  Sign Up
                </span>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
