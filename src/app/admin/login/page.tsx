"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

const ADMIN_EMAIL = "admin@weddingguard.com";
const ADMIN_PASS = "admin123";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && localStorage.getItem("admin_logged_in") === "true") {
            router.replace("/admin");
        }
    }, [router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            localStorage.setItem("admin_logged_in", "true");
            router.replace("/admin");
        } else {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <Shield size={48} className="text-blue-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Admin Portal
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Sign in to access the admin dashboard
                </p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        <FormField label="Email Address" htmlFor="email" required>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail size={16} />}
                                placeholder="Admin Email"
                            />
                        </FormField>
                        <FormField label="Password" htmlFor="password" required>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock size={16} />}
                                placeholder="••••••••"
                            />
                        </FormField>
                        <div>
                            <Button type="submit" variant="primary" fullWidth size="lg">
                                Sign In
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
} 