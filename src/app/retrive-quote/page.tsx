"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/Button";

const RetrieveQuote = () => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!input.trim()) {
                            toast.error("Please enter a Quote or Policy ID", {
                                variant: 'custom',
                                className: 'bg-white text-red-600'
                            });
                            return;
                        }
                        setLoading(true);
                        try {
                            const res = await fetch(`/api/quote/step?quoteNumber=${input.trim()}`);
                            if (!res.ok) {
                                toast.error("No quote or policy found with that ID", {
                                    variant: 'custom',
                                    className: 'bg-white text-red-600'
                                });
                                return;
                            }
                            const data = await res.json();
                            if (input.startsWith("WI")) {
                                router.push(`/customer/edit/${input}`);
                            } else if (input.startsWith("POC")) {
                                router.push(`/customer/edit/${input}`);
                            } else {
                                router.push(`/customer/edit/${input}`);
                            }
                        } catch (error) {
                            toast.error("Error retrieving quote or policy", {
                                variant: 'custom',
                                className: 'bg-white text-red-600'
                            });
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <label className="block text-sm font-medium text-blue-700">
                        Quote or Policy ID
                    </label>
                    <input
                        type="text"
                        placeholder="Enter quote or policy ID"
                        className="w-full mt-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? "Retrieving..." : "Retrieve"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default RetrieveQuote;
