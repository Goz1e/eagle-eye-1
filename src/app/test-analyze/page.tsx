'use client';

import { useState } from 'react';

export default function TestAnalyzePage() {
  const [inputText, setInputText] = useState('');
  const [addresses, setAddresses] = useState<string[]>([]);

  const handleAddressInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    if (text.trim()) {
      // Simple validation for testing
      const lines = text.split(/[\n,]/).map(line => line.trim()).filter(Boolean);
      const validAddresses = lines.filter(line => 
        line.length === 66 && 
        line.startsWith('0x') && 
        /^0x[a-fA-F0-9]{64}$/.test(line)
      );
      setAddresses(validAddresses);
    } else {
      setAddresses([]);
    }
  };

  const handleAnalyze = () => {
    alert(`Found ${addresses.length} valid addresses: ${addresses.join(', ')}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Wallet Analysis</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Wallet Address:
          </label>
          
          <textarea
            value={inputText}
            onChange={handleAddressInput}
            placeholder="Enter wallet address..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="text-sm text-gray-600">
            Input length: {inputText.length} | Valid addresses: {addresses.length}
          </div>
          
          {addresses.length > 0 && (
            <div className="space-y-2">
              <div className="text-green-600 font-medium">
                ✅ Found {addresses.length} valid address(es):
              </div>
              {addresses.map((addr, index) => (
                <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                  {addr}
                </div>
              ))}
              <button
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                🚀 Analyze Now ({addresses.length} addresses)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
