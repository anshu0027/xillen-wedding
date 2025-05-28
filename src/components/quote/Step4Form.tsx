import React from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/validators";
import { Mail } from "lucide-react";

export default function Step4Form({ state, onSave, onBack, emailSent, onEmail }) {
    return (
        <div className="space-y-8">
            <Card
                title="Quote Summary"
                subtitle={`Quote #${state.quoteNumber}`}
                className="mb-6 border-blue-100 bg-blue-50"
                footer={
                    <div className="flex flex-col md:flex-row justify-end gap-4 w-full">
                        <Button
                            variant="outline"
                            size="lg"
                            icon={<Mail size={18} />}
                            onClick={onEmail}
                            fullWidth
                        >
                            {emailSent ? 'Email Sent!' : 'Email Quote'}
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={onSave}
                            fullWidth
                        >
                            Save Quote
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 px-2 sm:px-4 md:px-8">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-800 mb-1">Total Premium</h3>
                            <p className="text-3xl font-bold text-blue-600">{formatCurrency(state.totalPremium)}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Premium Breakdown:</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Core Coverage:</span>
                                    <span className="font-medium">{formatCurrency(state.basePremium)}</span>
                                </div>
                                {state.liabilityCoverage !== 'none' && (
                                    <div className="flex justify-between text-sm">
                                        <span>Liability Coverage:</span>
                                        <span className="font-medium">{formatCurrency(state.liabilityPremium)}</span>
                                    </div>
                                )}
                                {state.liquorLiability && (
                                    <div className="flex justify-between text-sm">
                                        <span>Host Liquor Liability:</span>
                                        <span className="font-medium">{formatCurrency(state.liquorLiabilityPremium)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            <div className="flex flex-col md:flex-row justify-between gap-4 w-full mt-4">
                <Button type="button" variant="outline" onClick={onBack} fullWidth>Back</Button>
            </div>
        </div>
    );
} 