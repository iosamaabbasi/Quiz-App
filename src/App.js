import React, { useState, useEffect, useCallback, useMemo } from 'react';

import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);

  const categories = useMemo(() => [
    { id: 9, name: "General Knowledge", icon: "🧠" },
    { id: 18, name: "Computer Science", icon: "💻" },
    { id: 22, name: "Geography", icon: "🌍" },
    { id: 23, name: "History", icon: "📜" },
    { id: 17, name: "Science", icon: "🔬" },
    { id: 21, name: "Sports", icon: "⚽" },
    { id: 10, name: "Books", icon: "📚" },
    { id: 11, name: "Movies", icon: "🎬" },
    { id: 12, name: "Music", icon: "🎵" },
    { id: 15, name: "Video Games", icon: "🎮" }
  ], []);

  const [selectedCategory, setSelectedCategory] = useState(9);
  const [difficulty, setDifficulty] = useState("easy");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `https://opentdb.com/api.php?amount=20&category=${selectedCategory}&difficulty=${difficulty}&type=multiple&timestamp=${timestamp}`
      );
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const formattedQuestions = data.results.map((q, index) => ({
          id: `${timestamp}-${index}`,
          question: decodeURIComponent(q.question),
          correctAnswer: decodeURIComponent(q.correct_answer),
          options: [...q.incorrect_answers.map(a => decodeURIComponent(a)), 
                   decodeURIComponent(q.correct_answer)].sort(() => Math.random() - 0.5),
          userAnswer: null,
          isCorrect: false,
          timeTaken: 0
        }));
        setQuestions(formattedQuestions);
        setQuestionHistory([]);
        setTimeLeft(30);
        setTimerActive(true);
      } else {
        generateRandomQuestions();
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      generateRandomQuestions();
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, difficulty]);

  const handleNextQuestion = useCallback(() => {
    if (questions[currentQuestion]) {
      const questionData = {
        ...questions[currentQuestion],
        userAnswer: selectedOption,
        isCorrect: selectedOption === questions[currentQuestion]?.correctAnswer,
        timeTaken: 30 - timeLeft
      };
      setQuestionHistory(prev => [...prev, questionData]);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      const finalScore = {
        score,
        total: 200,
        percentage: Math.round((score / 200) * 100),
        date: new Date().toLocaleString(),
        category: categories.find(c => c.id === selectedCategory)?.name,
        questions: [...questionHistory]
      };
      setGameHistory(prev => [finalScore, ...prev.slice(0, 4)]);
      setShowScore(true);
      setTimerActive(false);
    }
  }, [currentQuestion, questions, score, selectedOption, timeLeft, selectedCategory, categories, questionHistory]);

  useEffect(() => {
    if (gameStarted) {
      fetchQuestions();
    }
  }, [gameStarted, fetchQuestions]);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0 && gameStarted && !loading) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameStarted && !loading) {
      handleNextQuestion();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, timerActive, gameStarted, loading, handleNextQuestion]);

  const generateRandomQuestions = () => {
    const shuffled = [...fallbackQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, 20);
    
    const timestamp = Date.now();
    const uniqueQuestions = shuffled.map((q, index) => ({
      ...q,
      id: `${timestamp}-${index}`,
      options: [...q.options].sort(() => Math.random() - 0.5),
      userAnswer: null,
      isCorrect: false,
      timeTaken: 0
    }));
    
    setQuestions(uniqueQuestions);
    setQuestionHistory([]);
    setTimeLeft(30);
    setTimerActive(true);
  };

  const handleAnswerClick = (option) => {
    if (selectedOption !== null || !gameStarted || loading) return;
    
    setSelectedOption(option);
    const correct = option === questions[currentQuestion]?.correctAnswer;
    setIsCorrect(correct);
    
    const questionData = {
      ...questions[currentQuestion],
      userAnswer: option,
      isCorrect: correct,
      timeTaken: 30 - timeLeft
    };
    setQuestionHistory(prev => [...prev, questionData]);
    
    if (correct) {
      const timeBonus = Math.floor(timeLeft / 3);
      setScore(prev => prev + 10 + timeBonus);
    }
    
    setTimerActive(false);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setGameStarted(false);
    setQuestionHistory([]);
  };

  const startNewGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setTimeLeft(30);
    setQuestionHistory([]);
    setGameStarted(true);
  };

  const getPerformanceMessage = () => {
    const percentage = (score / 200) * 100;
    if (percentage >= 90) return "Excellent! You are an expert! 🏆";
    if (percentage >= 70) return "Very good! You have good knowledge! 👍";
    if (percentage >= 50) return "Good, but can be better! 💪";
    return "Keep trying! You can do better! 🌟";
  };

  const getRandomCategory = () => {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    setSelectedCategory(randomCat.id);
  };

  const getCategoryIcon = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.icon : "🧠";
  };

  const calculateStats = () => {
    const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
    const wrongAnswers = questionHistory.length - correctAnswers;
    const averageTime = questionHistory.length > 0 
      ? Math.round(questionHistory.reduce((sum, q) => sum + q.timeTaken, 0) / questionHistory.length)
      : 0;
    
    return { correctAnswers, wrongAnswers, averageTime };
  };

  const stats = calculateStats();

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        <header className="header">
          <div className="header-title">
            <h1><span className="header-icon">🧠</span> Knowledge Quiz Game</h1>
            <div className="header-subtitle">20 New Questions Every Game!</div>
          </div>
          <div className="header-controls">
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            {gameStarted && !showScore && (
              <div className="score-display">Score: {score}</div>
            )}
          </div>
        </header>

        <main className="main-content">
          {!gameStarted ? (
            <div className="start-screen">
              <div className="welcome-section">
                <div className="welcome-animation">
                  <h2>Start Your Knowledge Journey! 🚀</h2>
                  <p className="welcome-text">20 new and interesting questions in every game</p>
                </div>
                
                <div className="stats-card">
                  <div className="stat-item">
                    <div className="stat-icon">❓</div>
                    <div className="stat-text">20 New Questions</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-text">30 Seconds per Question</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-text">10 Points per Correct Answer</div>
                  </div>
                </div>
              </div>
              
              <div className="game-settings">
                <div className="setting-card">
                  <h3><span className="setting-icon">📂</span> Select Category</h3>
                  <div className="category-select-wrapper">
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(Number(e.target.value))}
                      className="category-select"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="random-category-btn"
                      onClick={getRandomCategory}
                      title="Random Category"
                    >
                      🎲 Random
                    </button>
                  </div>
                </div>
                
                <div className="setting-card">
                  <h3><span className="setting-icon">⚡</span> Difficulty Level</h3>
                  <div className="difficulty-buttons">
                    {[
                      { level: 'easy', label: 'Easy', color: '#4CAF50', desc: 'Basic Knowledge' },
                      { level: 'medium', label: 'Medium', color: '#FF9800', desc: 'General Knowledge' },
                      { level: 'hard', label: 'Hard', color: '#F44336', desc: 'Advanced Knowledge' }
                    ].map(item => (
                      <button
                        key={item.level}
                        className={`difficulty-btn ${difficulty === item.level ? 'active' : ''}`}
                        onClick={() => setDifficulty(item.level)}
                      >
                        <div className="difficulty-label">{item.label}</div>
                        <div className="difficulty-desc">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {gameHistory.length > 0 && (
                  <div className="setting-card">
                    <h3><span className="setting-icon">📊</span> Recent Performance</h3>
                    <div className="history-preview">
                      {gameHistory[0] && (
                        <div className="last-score">
                          <div className="last-score-value">{gameHistory[0].percentage}%</div>
                          <div className="last-score-details">
                            <span>{gameHistory[0].category}</span>
                            <span>{gameHistory[0].date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="start-actions">
                <button 
                  className="start-btn primary-btn"
                  onClick={startNewGame}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Preparing Questions...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🎮</span>
                      Start New Game
                    </>
                  )}
                </button>
                
                <div className="quick-actions">
                  <button 
                    className="quick-btn"
                    onClick={() => {
                      getRandomCategory();
                      setDifficulty(['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]);
                    }}
                  >
                    🎲 Random Game
                  </button>
                  <button 
                    className="quick-btn"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
              </div>

              <div className="instructions">
                <h3><span className="instruction-icon">📝</span> How to Play?</h3>
                <div className="instruction-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">Select category and difficulty level</div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">Answer each question in 30 seconds</div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">Only 1 attempt per question</div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">Full history available at game end</div>
                  </div>
                </div>
              </div>
            </div>
          ) : showScore ? (
            <div className="score-section">
              <div className="score-header">
                <div className="trophy-animation">🏆</div>
                <h2>Game Complete! Congratulations! 🎉</h2>
                <p className="score-subtitle">You answered {score / 10} out of {questions.length} questions correctly</p>
              </div>
              
              <div className="score-display-main">
                <div className="score-circle">
                  <div className="score-circle-inner">
                    <span className="score-number">{score}</span>
                    <span className="score-total">/200</span>
                  </div>
                  <div className="score-percentage">{Math.round((score / 200) * 100)}%</div>
                </div>
                
                <div className="performance-card">
                  <div className="performance-icon">🌟</div>
                  <div className="performance-message">{getPerformanceMessage()}</div>
                </div>
              </div>
              
              <div className="score-details">
                <div className="detail-card">
                  <div className="detail-icon">✅</div>
                  <div className="detail-content">
                    <div className="detail-title">Correct Answers</div>
                    <div className="detail-value">{score / 10}</div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">❌</div>
                  <div className="detail-content">
                    <div className="detail-title">Wrong Answers</div>
                    <div className="detail-value">{stats.wrongAnswers}</div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">⏱️</div>
                  <div className="detail-content">
                    <div className="detail-title">Avg Time</div>
                    <div className="detail-value">{stats.averageTime}s</div>
                  </div>
                </div>
              </div>

              <div className="question-history">
                <h3><span className="history-icon">📝</span> Complete Question-by-Question History</h3>
                <p className="history-note">Here you can see all questions, your answers, correct answers, and status:</p>
                <div className="history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Question</th>
                        <th>Your Answer</th>
                        <th>Correct Answer</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionHistory.map((q, index) => (
                        <tr key={index} className={q.isCorrect ? 'correct-row' : 'wrong-row'}>
                          <td>{index + 1}</td>
                          <td className="question-cell">
                            <div className="question-preview">
                              {q.question.length > 50 ? q.question.substring(0, 50) + '...' : q.question}
                            </div>
                          </td>
                          <td className="user-answer">{q.userAnswer}</td>
                          <td className="correct-answer-cell">{q.correctAnswer}</td>
                          <td>
                            <span className={`status-badge ${q.isCorrect ? 'correct' : 'wrong'}`}>
                              {q.isCorrect ? '✅ Correct' : '❌ Wrong'}
                            </span>
                          </td>
                          <td className="time-cell">{q.timeTaken}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="action-buttons">
                <button className="action-btn primary-btn" onClick={restartQuiz}>
                  <span className="btn-icon">🔄</span>
                  Play Again
                </button>
                <button 
                  className="action-btn secondary-btn"
                  onClick={() => {
                    setGameStarted(false);
                    setShowScore(false);
                  }}
                >
                  <span className="btn-icon">🏠</span>
                  Main Screen
                </button>
                <button 
                  className="action-btn success-btn"
                  onClick={startNewGame}
                >
                  <span className="btn-icon">🎯</span>
                  New Game
                </button>
              </div>
              
              {gameHistory.length > 0 && (
                <div className="game-history">
                  <h3><span className="history-icon">📊</span> Recent Games History</h3>
                  <div className="history-list">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="history-item">
                        <div className="history-score">{game.percentage}%</div>
                        <div className="history-details">
                          <div className="history-category">{game.category}</div>
                          <div className="history-date">{game.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : questions.length > 0 && !loading ? (
            <>
              <div className="quiz-header">
                <div className="quiz-progress">
                  <div className="progress-info">
                    <span className="progress-text">Question {currentQuestion + 1} of 20</span>
                    <span className="progress-category">
                      {getCategoryIcon()} {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${((currentQuestion + 1) / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="quiz-meta">
                  <div className={`timer ${timeLeft < 10 ? 'warning' : ''}`}>
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-text">{timeLeft} Seconds</span>
                  </div>
                  <div className="score-display-quiz">
                    <span className="score-icon">🏆</span>
                    <span className="score-text">{score} Points</span>
                  </div>
                </div>
              </div>

              <div className="question-section">
                <div className="question-card">
                  <div className="question-header">
                    <span className="question-tag">
                      {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}
                    </span>
                    <span className="question-number">Question #{currentQuestion + 1}</span>
                  </div>
                  
                  <div className="question-text">
                    {questions[currentQuestion]?.question}
                  </div>
                  
                  <div className="answer-section">
                    {questions[currentQuestion]?.options.map((option, index) => {
                      let buttonClass = "answer-btn";
                      
                      if (selectedOption === option) {
                        buttonClass += isCorrect ? " correct" : " wrong";
                      }
                      
                      return (
                        <button
                          key={`${questions[currentQuestion]?.id}-${index}`}
                          className={buttonClass}
                          onClick={() => handleAnswerClick(option)}
                          disabled={selectedOption !== null || loading}
                        >
                          <span className="option-letter">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="option-text">{option}</span>
                          {selectedOption === option && (
                            <span className="option-feedback">
                              {isCorrect ? '✅' : '❌'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="quiz-footer">
                <div className="current-score-display">
                  <div className="current-score">
                    <span className="current-score-icon">⭐</span>
                    <span className="current-score-text">{score} Points</span>
                  </div>
                </div>
                
                <div className="quiz-actions">
                  {selectedOption && (
                    <div className={`feedback ${isCorrect ? 'correct' : 'wrong'}`}>
                      <div className="feedback-content">
                        <h3>
                          {isCorrect ? (
                            <>
                              <span className="feedback-icon">✅</span>
                              Excellent! Correct Answer
                            </>
                          ) : (
                            <>
                              <span className="feedback-icon">❌</span>
                              Wrong Answer - Next Question
                            </>
                          )}
                        </h3>
                        
                        <div className="feedback-actions">
                          <button className="next-btn" onClick={handleNextQuestion}>
                            {currentQuestion === 19 ? (
                              <>
                                <span className="next-icon">🏁</span>
                                See Results
                              </>
                            ) : (
                              <>
                                <span className="next-icon">→</span>
                                Next Question
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="quit-btn"
                    onClick={restartQuiz}
                  >
                    <span className="quit-icon">✖️</span>
                    Quit Game
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="loading-screen">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <h2>Preparing New Questions...</h2>
                <p className="loading-text">20 new and interesting questions in every game!</p>
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            <p>© 2024 Knowledge Quiz Game | New questions in every game!</p>
            <div className="footer-links">
              <button 
                className="footer-link"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button 
                className="footer-link"
                onClick={restartQuiz}
              >
                🔄 Restart Game
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

const fallbackQuestions = [
  {
    question: "What is the capital of Pakistan?",
    correctAnswer: "Islamabad",
    options: ["Lahore", "Karachi", "Islamabad", "Peshawar"]
  },
  {
    question: "Mount Everest is the highest peak in the world, what is its height?",
    correctAnswer: "8,848 meters",
    options: ["8,611 meters", "8,848 meters", "8,091 meters", "8,463 meters"]
  },
  {
    question: "Who discovered gravity?",
    correctAnswer: "Isaac Newton",
    options: ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"]
  },
  {
    question: "What is the chemical formula of water?",
    correctAnswer: "H₂O",
    options: ["CO₂", "H₂O", "O₂", "NaCl"]
  },
  {
    question: "Which planet is known as the Red Planet?",
    correctAnswer: "Mars",
    options: ["Venus", "Mars", "Jupiter", "Saturn"]
  },
  {
    question: "Who painted the Mona Lisa?",
    correctAnswer: "Leonardo da Vinci",
    options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"]
  },
  {
    question: "What is the largest ocean on Earth?",
    correctAnswer: "Pacific Ocean",
    options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]
  },
  {
    question: "Which country hosted the 2016 Summer Olympics?",
    correctAnswer: "Brazil",
    options: ["China", "Brazil", "UK", "USA"]
  },
  {
    question: "What is the speed of light?",
    correctAnswer: "299,792 km/s",
    options: ["299,792 km/s", "300,000 km/s", "280,000 km/s", "310,000 km/s"]
  },
  {
    question: "Which element has the chemical symbol 'Au'?",
    correctAnswer: "Gold",
    options: ["Silver", "Gold", "Aluminum", "Copper"]
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    correctAnswer: "William Shakespeare",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"]
  },
  {
    question: "What is the smallest country in the world?",
    correctAnswer: "Vatican City",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"]
  },
  {
    question: "Which programming language is known as the language of the web?",
    correctAnswer: "JavaScript",
    options: ["Python", "JavaScript", "Java", "C++"]
  },
  {
    question: "What is the human body's largest organ?",
    correctAnswer: "Skin",
    options: ["Liver", "Skin", "Lungs", "Heart"]
  },
  {
    question: "Which country invented pizza?",
    correctAnswer: "Italy",
    options: ["USA", "Italy", "Greece", "France"]
  },
  {
    question: "What year did World War II end?",
    correctAnswer: "1945",
    options: ["1944", "1945", "1946", "1947"]
  },
  {
    question: "Which gas do plants absorb from the atmosphere?",
    correctAnswer: "Carbon Dioxide",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"]
  },
  {
    question: "Who is known as the father of computers?",
    correctAnswer: "Charles Babbage",
    options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"]
  },
  {
    question: "Which is the longest river in the world?",
    correctAnswer: "Nile",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"]
  },
  {
    question: "What does CPU stand for?",
    correctAnswer: "Central Processing Unit",
    options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Computer Program Unit"]
  }
];

export default App;