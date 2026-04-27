import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';
import ATMTransferForm from '../../components/payment/ATMTransferForm';
import BankSlipUploadForm from '../../components/payment/BankSlipUploadForm';
import StripePaymentForm from '../../components/payment/StripePaymentForm';
import { useToast } from '../../components/ui/use-toast';
import { useCourse } from '../../lib/api';
import { apiUrl } from '../../lib/api-client';
import { ArrowLeft } from 'lucide-react';

async function parseJsonResponse(response: Response): Promise<{ success?: boolean; message?: string }> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    return { success: response.ok, message: response.ok ? "OK" : `Server error (${response.status})` };
}

const CLASS_FEE = 2500.00;

const PaymentPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedMethod, setSelectedMethod] = useState<string>('ATM_TRANSFER');
    const [isLoading, setIsLoading] = useState(false);

    const rawStudentId = Number(localStorage.getItem("authUserId"));
    const studentId = rawStudentId > 0 ? rawStudentId : null;
    const { data: course } = useCourse(Number(classId));
    const courseName = course?.title ?? 'Physics Class';

    const handleAtmSubmit = async (amount: number, referenceNumber: string) => {
        if (!studentId) {
            toast({ title: 'Error', description: 'You must be logged in to make a payment.', variant: 'destructive' });
            navigate('/signin');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(apiUrl('/api/student/payments/atm-transfer'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: Number(classId), studentId, amount, referenceNumber }),
            });
            const data = await parseJsonResponse(response);
            if (response.ok && data.success !== false) {
                toast({ title: 'Payment Submitted', description: 'Your payment is now awaiting accountant verification.' });
                navigate('/student/classes');
            } else {
                toast({ title: 'Error', description: data.message ?? 'Failed to submit payment', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit payment', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBankSlipSubmit = async (amount: number, file: File) => {
        if (!studentId) {
            toast({ title: 'Error', description: 'You must be logged in to make a payment.', variant: 'destructive' });
            navigate('/signin');
            return;
        }
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('classId', String(classId));
            formData.append('studentId', String(studentId));
            formData.append('amount', String(amount));
            formData.append('file', file);

            const response = await fetch(apiUrl('/api/student/payments/bank-slip'), {
                method: 'POST',
                body: formData,
            });
            const data = await parseJsonResponse(response);
            if (response.ok && data.success !== false) {
                toast({ title: 'Bank Slip Uploaded', description: 'Your bank slip is now awaiting accountant verification.' });
                navigate('/student/classes');
            } else {
                toast({ title: 'Error', description: data.message ?? 'Failed to upload bank slip', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to upload bank slip', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col">
            {/* Header */}
            <header className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-foreground">Make a Payment</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Class Enrollment Fee</h2>
                    <p className="text-muted-foreground mb-8">Select your preferred payment method to complete the class enrollment request.</p>

                    <PaymentMethodSelector selectedMethod={selectedMethod} onSelectMethod={setSelectedMethod} />

                    <div className="mt-8">
                        {selectedMethod === 'ATM_TRANSFER' && (
                            <ATMTransferForm onSubmit={handleAtmSubmit} isLoading={isLoading} amount={CLASS_FEE} />
                        )}

                        {selectedMethod === 'BANK_SLIP_UPLOAD' && (
                            <BankSlipUploadForm onSubmit={handleBankSlipSubmit} isLoading={isLoading} amount={CLASS_FEE} />
                        )}

                        {selectedMethod === 'ONLINE_PAYMENT' && (
                            <StripePaymentForm
                                classId={Number(classId)}
                                studentId={studentId ?? 0}
                                amount={CLASS_FEE}
                                courseName={courseName}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentPage;
