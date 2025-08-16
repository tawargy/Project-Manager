"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signupSchema = z.object({
  username: z.string().min(3, "Name is must be more 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password is required"),
});
type TSignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const form = useForm<TSignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmitHandler = async (data: TSignupFormData) => {
    try {
      console.log(data);
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });
      if (res.ok) {
        router.push("/signin");
      } else {
        console.log("Registation Failed");
      }
    } catch (err) {
      console.log(err);
    }
  };
  const signinModeHandler = () => {
    router.push("/signin");
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <Card className="w-full max-w-md ">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Enter user info to register</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                if (e.target !== e.currentTarget) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                e.stopPropagation();
                form.handleSubmit(onSubmitHandler)(e);
              }}
              className="space-y-4"
            >
              <div className="w-full space-y-2 ">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="just name"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full space-y-2 ">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@example.com"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center items-center mt-8">
                <Button type="submit">submit</Button>
              </div>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={signinModeHandler} className="mt-2">
              Have an account? signin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default SignupForm;
