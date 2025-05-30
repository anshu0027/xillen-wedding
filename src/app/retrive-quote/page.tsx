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
                            toast.error("Please enter a Quote or Policy ID");
                            return;
                        }
                        setLoading(true);
                        try {
                            const res = await fetch(`/api/quote/step?quoteNumber=${input.trim()}`);
                            if (!res.ok) {
                                toast.error("No quote or policy found with that ID");
                                return;
                            }
                            const data = await res.json();

                            // Check if the quote has been converted to a policy
                            if (data.quote && data.quote.policy && data.quote.policy.id) {
                                toast.error("This quote has been converted to a policy and can no longer be edited.");
                                alert("This quote has been converted to a policy and can no longer be edited. You'll be redirected to the Generate Quote page.");
                                router.push(`/customer/quote-generator`);
                                return;
                            }

                            // Existing logic for navigation - can be simplified if all prefixes lead to the same edit page
                            if (input.startsWith("WI") || input.startsWith("POC") || input.startsWith("QI-")) { // Assuming QI- is also a valid prefix for quotes not yet policies
                                router.push(`/customer/edit/${input}`);
                            } else {
                                // Fallback or handle unknown prefixes if necessary
                                toast.error("Invalid ID format or quote cannot be edited.");
                            }
                        } catch (error) {
                            toast.error("Error retrieving quote or policy");
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
