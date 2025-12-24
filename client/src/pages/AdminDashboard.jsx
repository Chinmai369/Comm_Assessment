import React, { useEffect, useState } from "react";

const AdminDashboard = ({ onHome }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCommissioner, setSelectedCommissioner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Session management state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");
  const [activatingId, setActivatingId] = useState(null);

  const fetchData = () => {
    setRefreshing(true);
    fetch("http://localhost:5000/api/results")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSession(data.session);
          setResults(data.results);
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const fetchQuestions = () => {
    fetch("http://localhost:5000/api/quiz/questions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuestions(data.questions);
        }
      })
      .catch(() => {});
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionError("");
      const response = await fetch("http://localhost:5000/api/sessions");
      const data = await response.json();

      if (data.success) {
        setSessions(data.data || []);
      } else {
        setSessionError("Failed to fetch sessions");
      }
    } catch (err) {
      setSessionError("Error loading sessions. Please try again.");
      console.error("Fetch sessions error:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleActivateSession = async (sessionId) => {
    if (activatingId) return; // Prevent multiple clicks

    try {
      setActivatingId(sessionId);
      setSessionError("");
      setSessionSuccess("");

      const response = await fetch("http://localhost:5000/api/sessions/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionSuccess("Session activated successfully!");
        // Re-fetch sessions and main data to update UI
        await fetchSessions();
        await fetchData();
        // Clear success message after 3 seconds
        setTimeout(() => setSessionSuccess(""), 3000);
      } else {
        setSessionError(data.message || "Failed to activate session");
      }
    } catch (err) {
      setSessionError("Error activating session. Please try again.");
      console.error("Activate session error:", err);
    } finally {
      setActivatingId(null);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQuestions();
    fetchSessions();
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData();
      if (activeTab === "analysis") {
        fetchQuestions();
      }
      if (activeTab === "sessions") {
        fetchSessions();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleRefresh = () => {
    fetchData();
    if (activeTab === "analysis") {
      fetchQuestions();
    }
    if (activeTab === "sessions") {
      fetchSessions();
    }
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      alert("Clear Data functionality requires backend implementation. Please contact the administrator.");
    }
  };

  const handleView = (result) => {
    setSelectedCommissioner(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCommissioner(null);
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600" style={{ backgroundColor: '#F5F5F5' }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  // Calculate metrics
  const totalLoggedIn = results.length;
  const completed = results.length; // All results are completed
  const inProgress = 0; // Would need backend support to track this
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score_percentage || 0), 0) / results.length)
    : 0;

  // Calculate answered and skipped (assuming 10 questions total)
  const totalQuestions = 10;
  const calculateAnswered = (result) => {
    return (result.correct_answers || 0) + (result.wrong_answers || 0);
  };
  const calculateSkipped = (result) => {
    return totalQuestions - calculateAnswered(result);
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
                <h1 className="text-3xl font-bold text-gray-800">Assessment Dashboard</h1>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#9C27B0' }}
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2"
                style={{ backgroundColor: '#F44336' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Data
              </button>
              <button
                onClick={handleHome}
                className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 bg-gray-700 hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                activeTab === "overview"
                  ? "text-purple-600"
                  : "text-gray-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Overview
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                activeTab === "analysis"
                  ? "text-purple-600"
                  : "text-gray-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Question Analysis
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                activeTab === "sessions"
                  ? "text-purple-600"
                  : "text-gray-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sessions
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E3F2FD' }}>
                <svg className="w-6 h-6" style={{ color: '#2196F3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{totalLoggedIn}</p>
            <p className="text-sm text-gray-600">Total Logged In</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF9C4' }}>
                <svg className="w-6 h-6" style={{ color: '#FBC02D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{inProgress}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
                <svg className="w-6 h-6" style={{ color: '#66BB6A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F3E5F5' }}>
                <svg className="w-6 h-6" style={{ color: '#9C27B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{averageScore}%</p>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          /* Commissioner Activity */
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Commissioner Activity</h2>
              <p className="text-sm text-gray-500">Real-time tracking of assessment participation</p>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">COMMISSIONER DETAILS</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">STATUS</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">LOGIN TIME</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">SCORE</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">ANSWERED</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">SKIPPED</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">DURATION</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-500">No commissioners have logged in yet</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      results.map((r, index) => {
                        const answered = calculateAnswered(r);
                        const skipped = calculateSkipped(r);
                        return (
                          <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-gray-800 font-medium">{r.commissioner_name}</td>
                            <td className="py-4 px-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E8F5E9', color: '#66BB6A' }}>
                                Completed
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-sm">
                              {new Date(r.attempted_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-gray-800 font-semibold">{r.score_percentage || 0}%</td>
                            <td className="py-4 px-4 text-gray-600">{answered}</td>
                            <td className="py-4 px-4 text-gray-600">{skipped}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm">-</td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => handleView(r)}
                                className="text-purple-600 hover:text-purple-800 text-sm font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Question Analysis</h2>
              <p className="text-sm text-gray-500">Performance breakdown by question</p>
            </div>
            <div className="border-t border-gray-200 pt-4">
              {questions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No questions available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => {
                    return (
                      <div key={q.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 mb-3">
                              Question {index + 1}: {q.question}
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">A</span>
                                  <p className="text-sm text-gray-700">{q.option_a}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">B</span>
                                  <p className="text-sm text-gray-700">{q.option_b}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">C</span>
                                  <p className="text-sm text-gray-700">{q.option_c}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">D</span>
                                  <p className="text-sm text-gray-700">{q.option_d}</p>
                                </div>
                              </div>
                            </div>
                            {q.correct_option && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <p className="text-sm font-semibold text-green-600">
                                  Correct Answer: <span className="text-green-700">{q.correct_option.toUpperCase()}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          /* Sessions Management */
          <div>
            {/* Messages */}
            {sessionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{sessionError}</span>
                  <button
                    onClick={() => setSessionError("")}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {sessionSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{sessionSuccess}</span>
                  <button
                    onClick={() => setSessionSuccess("")}
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
                {sessionsLoading && sessions.length === 0 ? (
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
                        {sessions.map((sessionItem) => {
                          const isActive = sessionItem.is_active === true;
                          const isActivating = activatingId === sessionItem.id;

                          return (
                            <tr
                              key={sessionItem.id}
                              className={`border-t border-gray-100 hover:bg-gray-50 ${
                                isActive ? "bg-green-50" : ""
                              }`}
                            >
                              <td className="py-4 px-4">
                                <p className="font-semibold text-gray-800">{sessionItem.session_name}</p>
                                <p className="text-xs text-gray-500">ID: {sessionItem.id}</p>
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
                                    onClick={() => handleActivateSession(sessionItem.id)}
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
        )}

        {/* View Modal */}
        {showModal && selectedCommissioner && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Commissioner Details: {selectedCommissioner.commissioner_name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-semibold text-gray-800">Completed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Score</p>
                    <p className="font-semibold text-gray-800">{selectedCommissioner.score_percentage || 0}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
                    <p className="font-semibold text-green-600">{selectedCommissioner.correct_answers || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Wrong Answers</p>
                    <p className="font-semibold text-red-600">{selectedCommissioner.wrong_answers || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Answered</p>
                    <p className="font-semibold text-gray-800">{calculateAnswered(selectedCommissioner)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Skipped</p>
                    <p className="font-semibold text-gray-800">{calculateSkipped(selectedCommissioner)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Attempted At</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedCommissioner.attempted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Auto-refreshing every 5 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
