'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletAddressInput } from '@/components/wallet';
import { UserProfile } from '@/components/auth/UserProfile';

export default function HomePage() {
  const [analyzedAddresses, setAnalyzedAddresses] = useState<string[]>([]);

  const handleAddressesConfirmed = (addresses: string[]) => {
    setAnalyzedAddresses(addresses);
    console.log('Addresses confirmed for analysis:', addresses);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Eagle Eye</h1>
                <p className="text-sm text-slate-500">Blockchain Analytics Platform</p>
              </div>
            </div>
            
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="container-max text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Advanced Wallet Analysis for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Aptos Blockchain
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Professional-grade analytics platform providing comprehensive insights, 
              real-time data, and actionable intelligence for DeFi analysis and risk assessment.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/analyze"
                className="btn-primary px-8 py-4 text-lg font-semibold shadow-prominent hover:shadow-elevated transition-smooth"
              >
                🚀 Launch Analysis
              </Link>
              <button className="btn-secondary px-8 py-4 text-lg font-semibold">
                📖 View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Analysis Section */}
      <section className="py-16">
        <div className="container-max">
          <div className="max-w-4xl mx-auto">
            <div className="card shadow-elevated">
              <div className="card-header">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-slate-900 mb-2">
                    Quick Wallet Check
                  </h2>
                  <p className="text-slate-600 text-lg">
                    Get instant insights into wallet activity and performance
                  </p>
                </div>
              </div>
              
              <div className="card-content">
                <WalletAddressInput
                  onAddressesConfirmed={handleAddressesConfirmed}
                  maxAddresses={5}
                  enableBatchAnalysis={true}
                  className="w-full"
                  placeholder="Paste wallet addresses here..."
                />
                
                {analyzedAddresses.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-800">
                          {analyzedAddresses.length} address{analyzedAddresses.length !== 1 ? 'es' : ''} ready for analysis
                        </span>
                      </div>
                      <Link
                        href="/analyze"
                        className="text-sm text-green-600 hover:text-green-800 font-medium hover:underline transition-smooth"
                      >
                        View Full Analysis →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-slate-900 mb-4">
              Professional Analytics Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built for analysts, researchers, and financial professionals who need 
              reliable blockchain intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Real-time Analytics
              </h3>
              <p className="text-slate-600">
                Live blockchain data with instant updates, real-time processing, 
                and comprehensive transaction tracking
              </p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-slate-600">
                No wallet data stored, all analysis performed securely on-chain 
                with enterprise-grade security protocols
              </p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Professional Reports
              </h3>
              <p className="text-slate-600">
                Export-ready reports with insights, recommendations, and 
                professional presentation for stakeholders
              </p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                High Performance
              </h3>
              <p className="text-slate-600">
                Optimized for speed with intelligent caching, parallel processing, 
                and efficient data aggregation
              </p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Advanced Insights
              </h3>
              <p className="text-slate-600">
                AI-powered pattern recognition, risk assessment, and 
                predictive analytics for informed decision making
              </p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-elevated transition-smooth">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Continuous Monitoring
              </h3>
              <p className="text-slate-600">
                Set up alerts, track changes over time, and monitor 
                wallet behavior with automated notifications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="container-max text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready for Professional Analysis?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join analysts and researchers who trust Eagle Eye for comprehensive 
              blockchain intelligence and professional reporting
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/analyze"
                className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg 
                           shadow-prominent hover:shadow-elevated transition-smooth text-lg"
              >
                🔍 Launch Advanced Analysis
              </Link>
              <button className="text-white border-2 border-white/30 hover:bg-white/10 font-medium px-8 py-4 rounded-lg 
                                transition-smooth text-lg">
                📧 Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 bg-slate-100">
        <div className="container-max">
          <div className="max-w-4xl mx-auto">
            <div className="card p-8">
              <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
                🚀 Getting Started
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Quick Start</h4>
                  <ol className="space-y-2 text-slate-600">
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</span>
                      <span>Enter wallet addresses above for instant validation</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</span>
                      <span>Click "Analyze These Wallets" for quick insights</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</span>
                      <span>View real-time results and export reports</span>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Advanced Features</h4>
                  <ol className="space-y-2 text-slate-600">
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</span>
                      <span>Use the Advanced Analysis page for comprehensive reports</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</span>
                      <span>Configure custom date ranges and token selection</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</span>
                      <span>Generate professional reports with insights and recommendations</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container-max">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
              <span className="text-xl">🦅</span>
            </div>
            <p className="text-slate-400 mb-4">
              Powered by Next.js and Aptos blockchain technology
            </p>
            <p className="text-slate-500 text-sm">
              © 2024 Eagle Eye. Professional blockchain analytics platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
