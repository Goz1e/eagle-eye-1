'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Types and interfaces
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
}

// Address validation function
const validateAptosAddress = (address: string): { isValid: boolean; error?: string } => {
  // Remove whitespace
  const trimmed = address.trim();
  
  // Check if empty
  if (!trimmed) {
    return { isValid: false, error: 'Address cannot be empty' };
  }
  
  // Check if starts with 0x
  if (!trimmed.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' };
  }
  
  // Check length (0x + up to 62 hex chars, but can be shorter)
  if (trimmed.length < 3 || trimmed.length > 66) {
    return { isValid: false, error: 'Invalid address length (expected 3-66 characters)' };
  }
  
  // Check if remaining characters are valid hex
  const hexPart = trimmed.slice(2);
  if (!/^[a-fA-F0-9]+$/.test(hexPart)) {
    return { isValid: false, error: 'Address contains invalid hex characters' };
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
  className = ''
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
  const maxCharacters = maxAddresses * 66; // Maximum possible characters

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🔍 Wallet Address Input
        </h3>
        <p className="text-sm text-gray-600">
          Enter 1-{maxAddresses} Aptos wallet addresses for analysis
        </p>
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <label htmlFor="address-input" className="block text-sm font-medium text-gray-700 mb-2">
          Wallet Addresses
        </label>
        <textarea
          id="address-input"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Enter addresses (one per line or comma-separated):\n0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\n0x1234567890123456789012345678901234567890`}
          className={`w-full h-32 px-3 py-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            hasErrors ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={showConfirmation}
        />
        
        {/* Character and address count */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            {addressCount} address{addressCount !== 1 ? 'es' : ''} 
            {maxAddresses && ` (max ${maxAddresses})`}
          </span>
          <span>
            {characterCount}/{maxCharacters} characters
          </span>
        </div>
      </div>

      {/* Validation Results */}
      {addresses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Address Validation Results
          </h4>
          
          <div className="space-y-2">
            {addresses.map((addr, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  addr.isValid && addr.confirmed
                    ? 'bg-blue-50 border-blue-200'
                    : addr.isValid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Status Icon */}
                  {addr.isValid && addr.confirmed ? (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  ) : addr.isValid ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  
                  {/* Address */}
                  <div>
                    <div className="font-mono text-sm">
                      {truncateAddress(addr.address)}
                    </div>
                    {addr.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {addr.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                {addr.isValid && (
                  <input
                    type="checkbox"
                    checked={addr.confirmed}
                    onChange={() => toggleAddressConfirmation(index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={showConfirmation}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!showConfirmation ? (
          <>
            <button
              onClick={confirmAllValid}
              disabled={!canConfirm || isValidating}
              className={`px-4 py-2 rounded-md font-medium ${
                canConfirm && !isValidating
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isValidating ? (
                <>
                  <ClockIcon className="h-4 w-4 inline mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                `✅ Confirm ${validAddresses.length} Valid Address${validAddresses.length !== 1 ? 'es' : ''}`
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
            >
              🔄 Reset
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleFinalConfirmation}
              disabled={!canAnalyze}
              className={`px-4 py-2 rounded-md font-medium ${
                canAnalyze
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              🚀 Analyze {confirmedAddresses.length} Address{confirmedAddresses.length !== 1 ? 'es' : ''}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
            >
              ✏️ Edit Addresses
            </button>
          </>
        )}
      </div>

      {/* Summary */}
      {showConfirmation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Ready for Analysis
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {confirmedAddresses.length} address{confirmedAddresses.length !== 1 ? 'es' : ''} confirmed and ready for blockchain analysis.
            {enableBatchAnalysis && ' Batch processing will be enabled for optimal performance.'}
          </p>
        </div>
      )}

      {/* Error Summary */}
      {hasErrors && (
        <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-900">
              Validation Issues Found
            </span>
          </div>
          <p className="text-sm text-red-700">
            Please fix the validation errors above before proceeding with analysis.
          </p>
        </div>
      )}
    </div>
  );
}
