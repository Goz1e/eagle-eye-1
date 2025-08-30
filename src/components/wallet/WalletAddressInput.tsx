'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface AddressState {
  address: string;
  isValid: boolean;
  error?: string;
  confirmed: boolean;
  isDuplicate: boolean;
}

interface WalletAddressInputProps {
  onAddressesConfirmed: (addresses: string[]) => void;
  maxAddresses?: number;
  enableBatchAnalysis?: boolean;
  initialAddresses?: string[];
  className?: string;
  placeholder?: string;
}

// Validate Aptos address format
const validateAptosAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (address.length !== 66) {
    return { isValid: false, error: 'Address must be 66 characters long' };
  }
  
  if (!address.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' };
  }
  
  if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
    return { isValid: false, error: 'Address must contain only hexadecimal characters' };
  }
  
  return { isValid: true };
};

// Truncate address for display
const truncateAddress = (address: string, start: number = 6, end: number = 4): string => {
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export default function WalletAddressInput({
  onAddressesConfirmed,
  maxAddresses = 10,
  enableBatchAnalysis = true,
  initialAddresses = [],
  className = '',
  placeholder
}: WalletAddressInputProps) {
  const [inputText, setInputText] = useState(initialAddresses.join('\n'));
  const [addresses, setAddresses] = useState<AddressState[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Parse and validate addresses from input text
  const parseAndValidateAddresses = useCallback((text: string): AddressState[] => {
    const lines = text.split(/[\n,]/).map(line => line.trim()).filter(Boolean);
    const uniqueLines = [...new Set(lines)];
    
    return uniqueLines.slice(0, maxAddresses).map((line, index) => {
      const validation = validateAptosAddress(line);
      const isDuplicate = uniqueLines.indexOf(line) !== index;
      
      return {
        address: line,
        isValid: validation.isValid && !isDuplicate,
        error: isDuplicate ? 'Duplicate address' : validation.error,
        confirmed: false,
        isDuplicate
      };
    });
  }, [maxAddresses]);

  // Update addresses when input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    if (text.trim()) {
      setIsValidating(true);
      // Debounce validation
      setTimeout(() => {
        const validated = parseAndValidateAddresses(text);
        setAddresses(validated);
        setIsValidating(false);
      }, 300);
    } else {
      setAddresses([]);
      setIsValidating(false);
    }
  }, [parseAndValidateAddresses]);

  // Toggle address confirmation
  const toggleAddressConfirmation = useCallback((index: number) => {
    setAddresses(prev => prev.map((addr, i) => 
      i === index ? { ...addr, confirmed: !addr.confirmed } : addr
    ));
  }, []);

  // Confirm all valid addresses
  const confirmAllValid = useCallback(() => {
    const validAddresses = addresses.filter(addr => addr.isValid);
    const confirmedAddresses = validAddresses.map(addr => ({ ...addr, confirmed: true }));
    setAddresses(confirmedAddresses);
    setShowConfirmation(true);
  }, [addresses]);

  // Handle final confirmation
  const handleFinalConfirmation = useCallback(() => {
    const confirmedAddresses = addresses
      .filter(addr => addr.isValid && addr.confirmed)
      .map(addr => addr.address);
    
    onAddressesConfirmed(confirmedAddresses);
  }, [addresses, onAddressesConfirmed]);

  // Reset component
  const handleReset = useCallback(() => {
    setInputText('');
    setAddresses([]);
    setShowConfirmation(false);
    onAddressesConfirmed([]);
  }, [onAddressesConfirmed]);

  // Computed values
  const validAddresses = useMemo(() => addresses.filter(addr => addr.isValid), [addresses]);
  const confirmedAddresses = useMemo(() => addresses.filter(addr => addr.isValid && addr.confirmed), [addresses]);
  const hasErrors = useMemo(() => addresses.some(addr => !addr.isValid), [addresses]);
  const canConfirm = useMemo(() => validAddresses.length > 0 && !hasErrors, [validAddresses, hasErrors]);
  const canAnalyze = useMemo(() => confirmedAddresses.length > 0, [confirmedAddresses]);

  // Character and address count
  const characterCount = inputText.length;
  const addressCount = addresses.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Input Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="form-label">
            Wallet Addresses
            <span className="text-slate-400 font-normal ml-2">({maxAddresses} max)</span>
          </label>
          
          {isValidating && (
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Validating...</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder={placeholder || `Enter addresses (one per line or comma-separated):
0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
0x1234567890123456789012345678901234567890`}
            className={`w-full min-h-[140px] px-4 py-3 border rounded-lg resize-none font-mono text-sm
                       focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-smooth
                       ${hasErrors ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}
                       ${isValidating ? 'border-blue-300 bg-blue-50' : ''}`}
          />
          
          {/* Status indicators */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{addressCount}/{maxAddresses}</span>
              <span>•</span>
              <span>{characterCount}/1000</span>
            </div>
            
            {validAddresses.length > 0 && !hasErrors && (
              <div className="flex items-center space-x-1 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">{validAddresses.length} valid</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Character count warning */}
        {characterCount > 800 && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
            ⚠️ Character limit approaching ({characterCount}/1000)
          </div>
        )}
      </div>

      {/* Enhanced Validation Results */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">
              Address Validation Results
            </h4>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">✓ {validAddresses.length} valid</span>
              {hasErrors && (
                <span className="text-red-600">✗ {addresses.filter(addr => !addr.isValid).length} errors</span>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            {addresses.map((addr, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-smooth
                           ${addr.isValid 
                             ? 'bg-green-50 border-green-200' 
                             : 'bg-red-50 border-red-200'
                           }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                                  ${addr.isValid ? 'bg-green-500' : 'bg-red-500'}`}>
                    {addr.isValid ? (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-slate-800 break-all">
                      {truncateAddress(addr.address)}
                    </code>
                    {!addr.isValid && addr.error && (
                      <div className="text-xs text-red-600 mt-1">{addr.error}</div>
                    )}
                  </div>
                </div>
                
                {addr.isValid && (
                  <button
                    onClick={() => toggleAddressConfirmation(index)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-smooth
                               ${addr.confirmed 
                                 ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                 : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                               }`}
                  >
                    {addr.confirmed ? '✓ Confirmed' : 'Confirm'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="btn-secondary text-sm"
            disabled={addresses.length === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
          
          {canConfirm && (
            <button
              onClick={confirmAllValid}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm {validAddresses.length} Valid Addresses
            </button>
          )}
        </div>
        
        {canAnalyze && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-slate-500">Ready for analysis</div>
              <div className="text-sm font-medium text-slate-700">{confirmedAddresses.length} addresses</div>
            </div>
            
            <button
              onClick={handleFinalConfirmation}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg 
                         transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                         shadow-elevated hover:shadow-prominent"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Now
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Help Text */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">How to use:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• Paste wallet addresses (one per line or comma-separated)</li>
              <li>• Addresses are validated in real-time as you type</li>
              <li>• Confirm valid addresses to proceed with analysis</li>
              <li>• Maximum {maxAddresses} addresses per analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
