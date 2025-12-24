import React, { useEffect, useState } from "react";

const AdminSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activatingId, setActivatingId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/sessions");
      const data = await response.json();

      if (data.success) {
        setSessions(data.data || []);
      } else {
        setError("Failed to fetch sessions");
      }
    } catch (err) {
      setError("Error loading sessions. Please try again.");
      console.error("Fetch sessions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleActivate = async (sessionId) => {
    if (activatingId) return; // Prevent multiple clicks

    try {
      setActivatingId(sessionId);
      setError("");
      setSuccess("");

      const response = await fetch("http://localhost:5000/api/sessions/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Session activated successfully!");
        // Re-fetch sessions to update UI
        await fetchSessions();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to activate session");
      }
    } catch (err) {
      setError("Error activating session. Please try again.");
      console.error("Activate session error:", err);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#64B5F6' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#66BB6A' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end justify-center gap-1 h-6">
                    <div className="w-1 bg-blue-700 h-2"></div>
                    <div className="w-1 bg-blue-700 h-4"></div>
                    <div className="w-1 bg-blue-700 h-3"></div>
                    <div className="w-1 bg-blue-700 h-5"></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-600">MUNICIPAL</p>
                <h1 className="text-3xl font-bold text-gray-800">Session Management</h1>
              </div>
            </div>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#9C27B0' }}
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
              <button
                onClick={() => setSuccess("")}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Sessions</h2>
            <p className="text-sm text-gray-500">Manage assessment sessions</p>
          </div>
          <div className="border-t border-gray-200 pt-4">
            {loading && sessions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-500">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No sessions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">SESSION NAME</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">STATUS</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const isActive = session.is_active === true;
                      const isActivating = activatingId === session.id;

                      return (
                        <tr
                          key={session.id}
                          className={`border-t border-gray-100 hover:bg-gray-50 ${
                            isActive ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">{session.session_name}</p>
                            <p className="text-xs text-gray-500">ID: {session.id}</p>
                          </td>
                          <td className="py-4 px-4">
                            {isActive ? (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                                style={{ backgroundColor: '#E8F5E9', color: '#66BB6A' }}
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                ACTIVE
                              </span>
                            ) : (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: '#F5F5F5', color: '#757575' }}
                              >
                                INACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isActive ? (
                              <button
                                disabled
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed"
                              >
                                Active
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(session.id)}
                                disabled={isActivating || activatingId !== null}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                style={{ backgroundColor: '#9C27B0' }}
                              >
                                {isActivating ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Activating...
                                  </span>
                                ) : (
                                  "Activate"
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSessions;

