import React, { useEffect, useState } from "react";
import { getUser } from "../utils/auth";

const TOTAL_TIME = 30;

const Quiz = ({ commissionerId: commissionerIdProp }) => {
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
    fetch("http://localhost:5000/api/quiz/questions")
      .then((res) => res.json())
      .then((data) => {
        // Store original questions in ID order
        setOriginalQuestions(data.questions);
        // Shuffle questions for display
        const shuffledQuestions = shuffleArray(data.questions);
        setQuestions(shuffledQuestions);
        setAnswers(new Array(shuffledQuestions.length).fill(""));
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
    setShowAnswer(true);
    setSubmitted(true);
  };

  const moveNext = () => {
    setShowAnswer(false);
    setSubmitted(false);
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

    fetch("http://localhost:5000/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commissioner_name: commissionerId,
        answers: orderedAnswers,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) setError(data.message);
        else setResult(data);
      });
  };

  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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
      <div className="min-h-screen p-6" style={{ backgroundColor: '#E8F5E9' }}>
        <div className="max-w-4xl mx-auto">
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
                  <h1 className="text-2xl font-bold text-gray-800">Assessment Complete</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Commissioner ID</p>
                <p className="text-lg font-semibold text-gray-800">{commissionerId}</p>
              </div>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-2xl p-8 mb-4 shadow-lg">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E0E0E0"
                    strokeWidth="8"
                    fill="none"
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
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: circleColor }}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${statusColor}`}>{status}</h2>
              <p className="text-gray-600 mb-6">
                You answered {correctCount} out of {questions.length} questions correctly
              </p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                  <p className="text-sm text-gray-600">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
                  <p className="text-sm text-gray-600">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#FF9800' }}>{skippedCount}</p>
                  <p className="text-sm text-gray-600">Skipped</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Results</h3>
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
                <div key={index} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-2">
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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#E8F5E9' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#64B5F6' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ backgroundColor: '#66BB6A' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-end justify-center gap-0.5 h-5">
                    <div className="w-1 bg-blue-700 h-2"></div>
                    <div className="w-1 bg-blue-700 h-4"></div>
                    <div className="w-1 bg-blue-700 h-3"></div>
                    <div className="w-1 bg-blue-700 h-5"></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-600">MUNICIPAL</p>
                <h1 className="text-xl font-bold text-gray-800">Assessment</h1>
              </div>
            </div>
            <div className="flex-1 mx-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: '#66BB6A' }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Question {current + 1} of {questions.length}</p>
              <p className="text-2xl font-bold" style={{ color: '#66BB6A' }}>{timeLeft}s</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{q.question}</h2>

          <div className="space-y-3 mb-6">
            {["A", "B", "C", "D"].map((opt) => {
              const selected = answers[current] === opt;
              // Handle both uppercase and lowercase correct_option
              const correctOptionRaw = q.correct_option || "";
              const correctOption = typeof correctOptionRaw === 'string' ? correctOptionRaw.toUpperCase() : "";
              const isCorrect = opt === correctOption;
              const isWrongSelected = selected && !isCorrect && showAnswer;
              const showCorrect = showAnswer && isCorrect;
              const showWrong = showAnswer && selected && !isCorrect;

              let borderClass = "border-gray-200 hover:border-gray-300";
              let bgClass = "";
              let circleClass = "bg-gray-200 text-gray-700";
              let textClass = "text-gray-800";

              if (showAnswer) {
                // Priority 1: Always highlight correct answer in green
                if (isCorrect) {
                  borderClass = "border-green-500";
                  bgClass = "bg-green-50";
                  circleClass = "bg-green-500 text-white";
                  textClass = "text-gray-800";
                } 
                // Priority 2: Highlight wrong selected answer in red
                else if (isWrongSelected) {
                  borderClass = "border-red-500";
                  bgClass = "bg-red-50";
                  circleClass = "bg-red-500 text-white";
                  textClass = "text-gray-800";
                }
                // Other unselected options remain gray
                else {
                  borderClass = "border-gray-200";
                  bgClass = "";
                  circleClass = "bg-gray-200 text-gray-700";
                  textClass = "text-gray-800";
                }
              } else if (selected) {
                // Before submission, selected option has green styling
                borderClass = "border-green-500 bg-green-50";
                circleClass = "bg-green-500 text-white";
              }

              return (
                <label
                  key={opt}
                  className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                    showAnswer ? "cursor-default" : "cursor-pointer"
                  } ${borderClass} ${bgClass}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold ${circleClass}`}
                  >
                    {opt}
                  </div>
                  <span className={`${textClass} flex-1`}>{q[`option_${opt.toLowerCase()}`]}</span>
                  {showCorrect && (
                    <span className="ml-2 text-green-600 font-semibold text-sm">✓ Correct</span>
                  )}
                  {showWrong && (
                    <span className="ml-2 text-red-600 font-semibold text-sm">✗ Wrong</span>
                  )}
                  {!showAnswer && (
                    <input
                      type="radio"
                      name={`question-${current}`}
                      className="sr-only"
                      checked={selected}
                      onChange={() => selectAnswer(opt)}
                    />
                  )}
                </label>
              );
            })}
          </div>

          {/* Feedback Message */}
          {showAnswer && answers[current] && (
            <div className={`mb-4 p-4 rounded-lg ${
              answers[current] === (q.correct_option?.toUpperCase() || "")
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              {answers[current] === (q.correct_option?.toUpperCase() || "") ? (
                <p className="text-green-700 font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Correct! Well done.
                </p>
              ) : (
                <div className="text-red-700 font-semibold">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Incorrect.</span>
                  </div>
                  {q.correct_option ? (
                    <div className="ml-7">
                      <p className="font-semibold mb-2">The correct answer is:</p>
                      <div className="bg-white p-4 rounded-lg border-2 border-green-500 shadow-sm">
                        <p className="text-green-700 font-bold text-lg">
                          <span className="inline-block w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mr-2 align-middle">
                            {q.correct_option.toUpperCase()}
                          </span>
                          {q[`option_${q.correct_option.toLowerCase()}`] || q[`option_${q.correct_option.toUpperCase()}`] || 'Not available'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="ml-7 text-sm font-normal">Correct answer information is not available.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center items-center gap-4">
            {answers[current] && !showAnswer && (
              <button
                onClick={submitCurrent}
                className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4DB6AC' }}
              >
                Submit Answer
              </button>
            )}
            {showAnswer && (
              <button
                onClick={moveNext}
                className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4DB6AC' }}
              >
                Next Question
              </button>
            )}
            {!showAnswer && (
              <button
                onClick={moveNext}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Skip Question
              </button>
            )}
          </div>

          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
