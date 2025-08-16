import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import auth from "@/lib/auth";
import { Shield, Users, BarChart3 } from "lucide-react";

async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Project Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your project management with real-time updates, advanced
            filtering, and role-based collaboration tools.
          </p>
          <div className="flex gap-4 justify-center">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="bg-blue-200 rounded-sm px-4 py-2 hover:bg-blue-300"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signin"
                className="bg-blue-200 rounded-sm px-4 py-2 hover:bg-blue-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Secure access control with Admin, Project Manager, and Developer
                roles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Real-time updates and seamless collaboration across your team
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Track progress, budgets, and performance with detailed insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default Home;
