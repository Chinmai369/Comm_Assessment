import React, { useState } from "react";

const CommissionerLogin = ({ onLogin, onAdminClick }) => {
  const [commissionerId, setCommissionerId] = useState("");

  const handleLogin = () => {
    if (!commissionerId.trim()) {
      alert("Please enter Commissioner ID");
      return;
    }
    onLogin(commissionerId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center mb-6">
          {/* Logo */}
          <div className="w-16 h-16 rounded-full mb-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#64B5F6' }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#66BB6A' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end justify-center gap-1 h-8">
                <div className="w-1.5 bg-blue-700 h-3"></div>
                <div className="w-1.5 bg-blue-700 h-5"></div>
                <div className="w-1.5 bg-blue-700 h-4"></div>
                <div className="w-1.5 bg-blue-700 h-6"></div>
              </div>
            </div>
          </div>
          
          <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">MUNICIPAL</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Municipal Commission</h1>
          <p className="text-base text-gray-600">Commissioner Assessment Portal</p>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commissioner ID
          </label>
          <input
            type="text"
            placeholder="Enter your Commissioner ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            value={commissionerId}
            onChange={(e) => setCommissionerId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {/* Start Assessment Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-lg text-white font-bold mb-4"
          style={{ backgroundColor: '#4DB6AC' }}
        >
          Start Assessment
        </button>

        {/* Assessment Details */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center mb-1">
            You will have 30 seconds per question
          </p>
          <div className="border-t border-gray-200 my-2"></div>
          <p className="text-sm text-gray-600 text-center">
            Total of 10 questions to complete
          </p>
        </div>

        {/* Administrator Dashboard Button */}
        <button
          onClick={onAdminClick}
          className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: '#9C27B0' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Administrator Dashboard
        </button>
      </div>
    </div>
  );
};

export default CommissionerLogin;
