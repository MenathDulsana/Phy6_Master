import React from 'react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selectedMethod, onSelectMethod }) => {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => onSelectMethod('ATM_TRANSFER')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
          selectedMethod === 'ATM_TRANSFER'
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'bg-secondary text-foreground hover:bg-accent'
        }`}
      >
        ATM Transfer
      </button>
      <button
        onClick={() => onSelectMethod('BANK_SLIP_UPLOAD')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
          selectedMethod === 'BANK_SLIP_UPLOAD'
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'bg-secondary text-foreground hover:bg-accent'
        }`}
      >
        Bank Slip Upload
      </button>
      <button
        onClick={() => onSelectMethod('ONLINE_PAYMENT')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
          selectedMethod === 'ONLINE_PAYMENT'
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'bg-secondary text-foreground hover:bg-accent'
        }`}
      >
        Online Payment
      </button>
    </div>
  );
};

export default PaymentMethodSelector;
