import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { setAuth } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [userCode, setUserCode] = useState('');
  const [ulbName, setUlbName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Common ULB names - can be extended or fetched from API if needed
  const ulbOptions = [
    'ULB-1',
    'ULB-2',
    'ULB-3',
    'ULB-4',
    'ULB-5',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!role) {
      setError('Please select a role');
      setLoading(false);
      return;
    }

    if (!userCode.trim()) {
      setError('Please enter User ID');
      setLoading(false);
      return;
    }

    if (role === 'commissioner' && !ulbName) {
      setError('Please select ULB');
      setLoading(false);
      return;
    }

    try {
      // Prepare request body based on role
      const requestBody = {
        role,
        user_code: userCode.trim(),
      };

      if (role === 'commissioner') {
        requestBody.ulb_name = ulbName;
      }

      // Call login API
      const response = await apiPost('/auth/login', requestBody);

      if (response.success) {
        // Store token and user data
        setAuth(response.token, response.user);

        // Redirect based on role
        if (response.user.role === 'commissioner' || response.user.role === 'engineer') {
          navigate('/quiz');
        } else if (response.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/login');
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setUlbName(''); // Reset ULB when role changes
    setError(''); // Clear error when role changes
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Role Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={handleRoleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="engineer">Engineer</option>
              <option value="commissioner">Commissioner</option>
            </select>
          </div>

          {/* User ID Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your User ID"
              value={userCode}
              onChange={(e) => {
                setUserCode(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* ULB Dropdown - Only visible for commissioner */}
          {role === 'commissioner' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ULB <span className="text-red-500">*</span>
              </label>
              <select
                value={ulbName}
                onChange={(e) => {
                  setUlbName(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                required
              >
                <option value="">Select ULB</option>
                {ulbOptions.map((ulb) => (
                  <option key={ulb} value={ulb}>
                    {ulb}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold transition-opacity ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#4DB6AC' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

