import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

type EnrollmentStatus = 'PENDING' | 'PAYMENT_SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | null;

const MAX_POLLS = 12;
const POLL_INTERVAL_MS = 3000;

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  const sessionId = searchParams.get('session_id');
  const userId = Number(localStorage.getItem('authUserId'));

  useEffect(() => {
    if (!userId) {
      setIsPolling(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/student/enrollments/status/${userId}`);
        if (!res.ok) return;
        const enrollments: Array<{ status: string }> = await res.json();
        // Stripe webhook sets enrollment to PAYMENT_SUBMITTED after pay; ACTIVE comes after receipt.
        const confirmed = enrollments.find(
          (e) =>
            e.status === 'ACTIVE' ||
            e.status === 'APPROVED' ||
            e.status === 'PAYMENT_SUBMITTED'
        );
        if (confirmed) {
          setEnrollmentStatus(confirmed.status as EnrollmentStatus);
          setIsPolling(false);
          return;
        }
      } catch {
        // network error — keep polling
      }
      setPollCount((c) => c + 1);
    };

    if (!isPolling) return;
    const timer = setInterval(async () => {
      await poll();
    }, POLL_INTERVAL_MS);

    poll(); // run immediately on mount too

    return () => clearInterval(timer);
  }, [userId, isPolling]);

  // Stop polling after max attempts
  useEffect(() => {
    if (pollCount >= MAX_POLLS) {
      setIsPolling(false);
    }
  }, [pollCount]);

  const isConfirmed =
    enrollmentStatus === 'ACTIVE' ||
    enrollmentStatus === 'APPROVED' ||
    enrollmentStatus === 'PAYMENT_SUBMITTED';
  const isTimedOut = !isPolling && !isConfirmed;
  const isFullyActive =
    enrollmentStatus === 'ACTIVE' || enrollmentStatus === 'APPROVED';

  if (isPolling) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">Confirming Payment...</p>
            <p className="text-sm text-gray-500 text-center">
              Waiting for Stripe to confirm your transaction. This usually takes a few seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <Card className="w-full max-w-md border-2 border-yellow-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">Payment Processing</CardTitle>
            <CardDescription className="text-gray-600">
              Your payment was received. Enrollment is being confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
              Stripe has processed your payment. Enrollment confirmation may take a moment — please check
              your classes page or refresh in a few seconds.
            </div>
            {sessionId && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Session ID</p>
                <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
              </div>
            )}
            <div className="space-y-2">
              <Button onClick={() => navigate('/student/classes')} className="w-full" size="lg">
                Check My Classes
              </Button>
              <Button onClick={() => navigate('/student/dashboard')} variant="outline" className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md border-2 border-green-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {isFullyActive
              ? 'Your enrollment is now confirmed'
              : 'Your payment was received — enrollment will finalize when your receipt is issued'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm text-gray-700 mb-2">✓ Payment completed successfully</p>
            <p className="text-sm text-gray-600 mb-2">
              {isFullyActive
                ? '✓ Enrollment confirmed by the server'
                : '✓ Payment recorded — your enrollment is being finalized'}
            </p>
            <p className="text-sm text-gray-600">
              {isFullyActive ? '✓ You can now access this class' : '✓ You will have full access after the official receipt is issued'}
            </p>
          </div>

          {sessionId && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">Session ID</p>
              <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The accountant will generate your receipt shortly</li>
              <li>• You will receive a notification once the receipt is ready</li>
              <li>• You can access your class materials now</li>
              <li>• View your payment in the payment history</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button onClick={() => navigate('/student/classes')} className="w-full bg-green-600 hover:bg-green-700" size="lg">
              View My Classes
            </Button>
            <Button onClick={() => navigate('/student/dashboard')} variant="outline" className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
