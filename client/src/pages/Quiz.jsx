import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/auth";
import { apiGet, apiPost } from "../utils/api";

const TOTAL_TIME = 30;

const Quiz = ({ commissionerId: commissionerIdProp }) => {
  const navigate = useNavigate();
  // Get commissioner ID from prop or from auth user
  const user = getUser();
  const commissionerId = commissionerIdProp || user?.user_code || "";
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]); // Store original order for submission
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
const [timeSpent, setTimeSpent] = useState([]);


  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    apiGet("/quiz/questions")
      .then((data) => {
        // Store original questions in ID order
        setOriginalQuestions(data.questions);
        // Shuffle questions for display
        const shuffledQuestions = shuffleArray(data.questions);
        setQuestions(shuffledQuestions);
        setAnswers(new Array(shuffledQuestions.length).fill(""));
      })
      .catch((err) => {
        setError("Failed to load questions. Please try again.");
        console.error("Error fetching questions:", err);
      });
  }, []);

  // ⏱️ TIMER
  useEffect(() => {
    if (result) return;

    if (timeLeft === 0) {
      moveNext();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, result]);

  const selectAnswer = (option) => {
    const updated = [...answers];
    updated[current] = option;
    setAnswers(updated);
  };

  const submitCurrent = () => {
    if (!answers[current]) {
      setError("Please select an option or skip");
      return;
    }
    // Move to next question immediately without showing answer
    setError("");
    setTimeLeft(TOTAL_TIME);

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const moveNext = () => {
    setError("");
    setTimeLeft(TOTAL_TIME);

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    // Map answers back to original question order (by ID) for backend submission
    const answersByQuestionId = {};
    questions.forEach((q, index) => {
      answersByQuestionId[q.id] = answers[index] || "";
    });
    
    // Create answers array in original question order
    const orderedAnswers = originalQuestions.map(q => answersByQuestionId[q.id] || "");

    apiPost("/quiz/submit", {
      commissioner_name: commissionerId,
      answers: orderedAnswers,
    })
      .then((data) => {
        if (!data.success) setError(data.message);
        else setResult(data);
      })
      .catch((err) => {
        setError("Failed to submit quiz. Please try again.");
        console.error("Error submitting quiz:", err);
      });
  };

  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout? Your progress will be lost.")) {
      logout();
      navigate("/login");
    }
  };

  // Results Page
  if (result) {
    // Calculate skipped questions from the answers array
    const skippedCount = answers.filter(a => !a || a === "").length;
    const correctCount = result.correct || 0;
    // Wrong count should exclude skipped questions
    const wrongCount = questions.length - correctCount - skippedCount;
    const percentage = result.percentage || 0;
    const status = percentage >= 70 ? "Excellent" : percentage >= 50 ? "Good" : percentage >= 30 ? "Fair" : "Needs Improvement";
    const statusColor = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-blue-600" : percentage >= 30 ? "text-yellow-600" : "text-red-600";
    const circleColor = percentage >= 70 ? "#4CAF50" : percentage >= 50 ? "#2196F3" : percentage >= 30 ? "#FF9800" : "#F44336";

    return (
      <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: '#E8F5E9' }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 mb-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full relative overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#64B5F6' }}></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#66BB6A' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end justify-center gap-1 h-5 sm:h-6">
                      <div className="w-1 bg-blue-700 h-2"></div>
                      <div className="w-1 bg-blue-700 h-4"></div>
                      <div className="w-1 bg-blue-700 h-3"></div>
                      <div className="w-1 bg-blue-700 h-5"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-600">MUNICIPAL</p>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Assessment Complete</h1>
                </div>
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right flex flex-col sm:flex-col items-start sm:items-end gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Commissioner ID</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 break-all">{commissionerId}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 mb-4 shadow-lg">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#E0E0E0"
                    strokeWidth="6"
                    fill="none"
                    className="sm:hidden"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke={circleColor}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    className="sm:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E0E0E0"
                    strokeWidth="8"
                    fill="none"
                    className="hidden sm:block"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={circleColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    className="hidden sm:block"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold" style={{ color: circleColor }}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${statusColor}`}>{status}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center px-4">
                You answered {correctCount} out of {questions.length} questions correctly
              </p>
              <div className="flex gap-4 sm:gap-6 w-full justify-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{correctCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{wrongCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: '#FF9800' }}>{skippedCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Skipped</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Detailed Results</h3>
            {questions.map((q, index) => {
              const userAnswer = answers[index] || "";
              const correctOptionRaw = q.correct_option || "";
              const correctOption = typeof correctOptionRaw === 'string' ? correctOptionRaw.toUpperCase() : "";
              const isCorrect = userAnswer && userAnswer === correctOption;
              const isSkipped = !userAnswer || userAnswer === "";
              const isExpanded = expandedQuestions[index];
              
              // Get the correct answer text - try both lowercase and uppercase
              const correctAnswerText = correctOptionRaw 
                ? (q[`option_${correctOptionRaw.toLowerCase()}`] || q[`option_${correctOptionRaw.toUpperCase()}`] || "")
                : "";

              return (
                <div key={index} className="border-b border-gray-200 py-3 sm:py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-800 mb-2 leading-relaxed">
                        {index + 1}. {q.question}
                      </p>
                      {isSkipped ? (
                        <p className="text-sm mb-2 font-semibold" style={{ color: '#FF9800' }}>Not answered</p>
                      ) : isCorrect ? (
                        <p className="text-sm mb-2 text-green-600 font-semibold">Correct</p>
                      ) : (
                        <p className="text-sm mb-2 text-red-600 font-semibold">Incorrect</p>
                      )}
                      {!isSkipped && !isCorrect && userAnswer && (
                        <p className="text-sm text-gray-600 mb-1">
                          Your answer: <span className="font-medium">{q[`option_${userAnswer.toLowerCase()}`] || 'N/A'}</span>
                        </p>
                      )}
                      {correctOption && correctAnswerText ? (
                        <p className="text-sm text-green-600 mt-1">
                          Correct answer: <span className="font-medium">{correctOption}: {correctAnswerText}</span>
                        </p>
                      ) : correctOption ? (
                        <p className="text-sm text-green-600 mt-1">
                          Correct answer: <span className="font-medium">{correctOption}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1 italic">Correct answer information not available</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleQuestion(index)}
                      className="ml-4 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: '#E8F5E9' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 mb-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#64B5F6' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#66BB6A' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end justify-center gap-0.5 h-4 sm:h-5">
                    <div className="w-1 bg-blue-700 h-2"></div>
                    <div className="w-1 bg-blue-700 h-4"></div>
                    <div className="w-1 bg-blue-700 h-3"></div>
                    <div className="w-1 bg-blue-700 h-5"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-600">MUNICIPAL</p>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Assessment</h1>
              </div>
            </div>
            <div className="w-full sm:flex-1 sm:mx-4 order-3 sm:order-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: '#66BB6A' }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto order-2 sm:order-3">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-600">Q {current + 1}/{questions.length}</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: '#66BB6A' }}>{timeLeft}s</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xs:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">{q.question}</h2>

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {["A", "B", "C", "D"].map((opt) => {
              const selected = answers[current] === opt;

              return (
                <label
                  key={opt}
                  className={`flex items-start sm:items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selected 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-3 sm:mr-4 font-semibold flex-shrink-0 mt-0.5 sm:mt-0 ${
                      selected 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <span className="text-sm sm:text-base">{opt}</span>
                  </div>
                  <span className="text-sm sm:text-base text-gray-800 flex-1 leading-relaxed">{q[`option_${opt.toLowerCase()}`]}</span>
                  <input
                    type="radio"
                    name={`question-${current}`}
                    className="sr-only"
                    checked={selected}
                    onChange={() => selectAnswer(opt)}
                  />
                </label>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
            {answers[current] && (
              <button
                onClick={submitCurrent}
                className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity text-sm sm:text-base"
                style={{ backgroundColor: '#4DB6AC' }}
              >
                Submit Answer
              </button>
            )}
            <button
              onClick={moveNext}
              className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Skip Question
            </button>
          </div>

          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
