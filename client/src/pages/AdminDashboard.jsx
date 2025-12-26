import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiRequest } from "../utils/api";

const AdminDashboard = ({ onHome }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCommissioner, setSelectedCommissioner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Session management state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");
  const [activatingId, setActivatingId] = useState(null);

  const fetchData = () => {
    setRefreshing(true);
    apiGet("/results")
      .then((data) => {
        if (data.success) {
          setSession(data.session);
          setResults(data.results || []);
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const fetchQuestions = (sessionId = null) => {
    // First fetch full questions with options from quiz questions API
    apiGet("/quiz/questions")
      .then((quizData) => {
        if (quizData.success) {
          const fullQuestions = quizData.questions;

          if (sessionId) {
            // Then fetch analysis metrics and merge them
            apiGet(`/results/question-analysis/${sessionId}`)
              .then((analysisData) => {
                if (analysisData.success) {
                  const merged = fullQuestions.map((q) => {
                    const metrics = analysisData.data.find(
                      (m) => m.question_id === q.id
                    );
                    return {
                      ...q,
                      correct: metrics ? parseInt(metrics.correct_count) : 0,
                      wrong: metrics ? parseInt(metrics.wrong_count) : 0,
                      skipped: metrics ? parseInt(metrics.skipped_count) : 0,
                      responses: metrics ? metrics.responses : []
                    };
                  });
                  setQuestions(merged);
                } else {
                  setQuestions(fullQuestions);
                }
              })
              .catch((err) => {
                console.error("Error fetching analysis:", err);
                setQuestions(fullQuestions);
              });
          } else {
            setQuestions(fullQuestions);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching questions:", err);
      });
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionError("");
      const data = await apiGet("/sessions");

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

      const data = await apiPost("/sessions/activate", { session_id: sessionId });

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
    fetchQuestions(activeTab === "analysis" ? session?.id : null);
    fetchSessions();
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData();
      if (activeTab === "analysis") {
        fetchQuestions(session?.id);
      }
      if (activeTab === "sessions") {
        fetchSessions();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, session?.id]);

  const handleRefresh = () => {
    fetchData();
    if (activeTab === "analysis") {
      fetchQuestions(session?.id);
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

  const handleViewQuestions = (sessionItem) => {
    setViewingSession(sessionItem);
    setLoadingQuestions(true);
    setShowQuestionsModal(true);
    
    apiGet(`/quiz/questions?sessionId=${sessionItem.id}`)
      .then((data) => {
        if (data.success) {
          setSessionQuestions(data.questions);
        }
        setLoadingQuestions(false);
      })
      .catch((err) => {
        console.error("Error fetching session questions:", err);
        setLoadingQuestions(false);
      });
  };

  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setEditFormData({ ...q });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData({});
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const data = await apiPut(`/quiz/questions/${editingQuestionId}`, editFormData);

      if (data.success) {
        // Update local state
        setSessionQuestions(prev => prev.map(q => q.id === editingQuestionId ? data.data : q));
        setEditingQuestionId(null);
        setEditFormData({});
        // Also refresh the analysis tab if it's active
        if (activeTab === "analysis") {
          fetchQuestions(session?.id);
        }
      } else {
        alert(data.message || "Failed to update question");
      }
    } catch (err) {
      console.error("Error saving question:", err);
      alert("An error occurred while saving the question");
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCommissioner(null);
  };

  const closeQuestionsModal = () => {
    setShowQuestionsModal(false);
    setViewingSession(null);
    setSessionQuestions([]);
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate("/");
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
    ? Math.round(results.reduce((sum, r) => sum + (Number(r.score_percentage) || 0), 0) / results.length)
    : 0;

  // Calculate answered and skipped
  const totalQuestionsCount = questions.length || 10;
  const calculateAnswered = (result) => {
    return (result.correct_answers || 0) + (result.wrong_answers || 0);
  };
  const calculateSkipped = (result) => {
    return totalQuestionsCount - calculateAnswered(result);
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
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">COMMISSIONER DETAILS</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">ULB NAME</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">ROLE</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">STATUS</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">LOGIN TIME</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">SESSION</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">TOTAL Q.</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">ANSWERED</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">SKIPPED</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">CORRECT</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">SCORE</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">AVG DURATION</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4 whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="py-12 text-center">
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
                            <td className="py-4 px-4 text-gray-800 font-medium whitespace-nowrap">{r.commissioner_name}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">{r.ulb_name}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm capitalize whitespace-nowrap">{r.role}</td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E8F5E9', color: '#66BB6A' }}>
                                Completed
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">
                              {new Date(r.attempted_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">{r.session_name}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm">{totalQuestionsCount}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm">{answered}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm">{skipped}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm font-semibold text-green-600">{r.correct_answers}</td>
                            <td className="py-4 px-4 text-gray-800 font-bold">{r.score_percentage || 0}%</td>
                            <td className="py-4 px-4 text-gray-600 text-sm">-</td>
                            <td className="py-4 px-4 whitespace-nowrap">
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
                <div className="space-y-12">
                  {questions.map((q, index) => {
                    const correctAnswerText = q[`option_${q.correct_option?.toLowerCase()}`];
                    return (
                      <div key={q.id || index} className="pb-8 border-b border-gray-100 last:border-b-0">
                        {/* Question Header */}
                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            Question {index + 1}: {q.question}
                          </h3>
                          <p className="text-sm font-semibold text-green-600">
                            Correct Answer: {correctAnswerText}
                          </p>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-8 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600">{q.correct || 0}</p>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Correct</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">{q.wrong || 0}</p>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Incorrect</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-500">{q.skipped || 0}</p>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Skipped</p>
                          </div>
                        </div>

                        {/* Detailed Responses Table */}
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">COMMISSIONER</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ULB</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">STATUS</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">SELECTED ANSWER</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">TIME SPENT</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">RESULT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {(!q.responses || q.responses.length === 0) ? (
                                <tr>
                                  <td colSpan="6" className="py-8 text-center text-gray-400 italic">No responses recorded for this question yet</td>
                                </tr>
                              ) : (
                                q.responses.map((resp, ridx) => {
                                  const selectedText = resp.selected_option ? q[`option_${resp.selected_option.toLowerCase()}`] : "-";
                                  const isSkipped = resp.status === 'skipped';
                                  
                                  return (
                                    <tr key={ridx} className="hover:bg-gray-50 transition-colors">
                                      <td className="py-4 px-4 font-medium text-gray-800">{resp.commissioner_name}</td>
                                      <td className="py-4 px-4 text-gray-600">{resp.ulb_name}</td>
                                      <td className="py-4 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                          isSkipped 
                                            ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                          {resp.status}
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 text-gray-600">{selectedText}</td>
                                      <td className="py-4 px-4 text-gray-400">-</td>
                                      <td className="py-4 px-4">
                                        {isSkipped ? (
                                          <span className="text-gray-400 italic">Not answered</span>
                                        ) : resp.is_correct ? (
                                          <span className="flex items-center gap-1.5 text-green-600 font-bold">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Correct
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1.5 text-red-600 font-bold">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            Incorrect
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
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
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase py-3 px-4">ACTIONS</th>
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
                                <div className="flex items-center gap-2">
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
                                  <button
                                    onClick={() => handleViewQuestions(sessionItem)}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-purple-600 border border-purple-600 hover:bg-purple-50 transition-colors"
                                  >
                                    View Questions
                                  </button>
                                </div>
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

        {/* Questions Modal */}
        {showQuestionsModal && viewingSession && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeQuestionsModal}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Questions for Session: {viewingSession.session_name}
                  </h3>
                  <p className="text-sm text-gray-500">Total Questions: {sessionQuestions.length}</p>
                </div>
                <button
                  onClick={closeQuestionsModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingQuestions ? (
                <div className="py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-500">Loading questions...</p>
                </div>
              ) : sessionQuestions.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500 text-lg">No questions found for this session.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessionQuestions.map((q, index) => (
                    <div key={q.id || index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      {editingQuestionId === q.id ? (
                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                          <div className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1 space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
                                <textarea
                                  name="question"
                                  value={editFormData.question}
                                  onChange={handleEditFormChange}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                  rows="2"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['a', 'b', 'c', 'd'].map((opt) => (
                                  <div key={opt}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Option {opt.toUpperCase()}</label>
                                    <input
                                      type="text"
                                      name={`option_${opt}`}
                                      value={editFormData[`option_${opt}`]}
                                      onChange={handleEditFormChange}
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                      required
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Option</label>
                                  <select
                                    name="correct_option"
                                    value={editFormData.correct_option}
                                    onChange={handleEditFormChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                  >
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                  </select>
                                </div>
                                <div className="flex items-end gap-2">
                                  <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-800 flex-1">{q.question}</h4>
                              <button
                                onClick={() => handleEditQuestion(q)}
                                className="ml-4 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-600 rounded-md hover:bg-purple-600 hover:text-white transition-all"
                              >
                                Edit Question
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                              {['a', 'b', 'c', 'd'].map((opt) => (
                                <div 
                                  key={opt}
                                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                                    q.correct_option?.toLowerCase() === opt 
                                      ? 'bg-green-50 border-green-200 text-green-800' 
                                      : 'bg-white border-gray-200 text-gray-600'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    q.correct_option?.toLowerCase() === opt 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {opt.toUpperCase()}
                                  </span>
                                  <span>{q[`option_${opt}`]}</span>
                                  {q.correct_option?.toLowerCase() === opt && (
                                    <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-500">Correct Option:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">
                                Option {q.correct_option}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={closeQuestionsModal}
                  className="px-8 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-colors shadow-lg"
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
