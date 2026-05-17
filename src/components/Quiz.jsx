import { useState, useEffect } from 'react';
import '../styles/Quiz.css';

function Quiz({ questions, onAnswerQuestion }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (selectedLevel) {
      const filtered = questions.filter(q => q.level === selectedLevel);
      setFilteredQuestions(filtered);
      setCurrentIndex(0);
      setShowExplanation(false);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [selectedLevel, questions]);

  if (!selectedLevel) {
    return (
      <div className="quiz-container">
        <div className="level-select">
          <h2>Select Your Level</h2>
          <div className="level-buttons">
            <button
              onClick={() => setSelectedLevel('A2')}
              className="level-btn"
            >
              A2 - Elementary
            </button>
            <button
              onClick={() => setSelectedLevel('B1')}
              className="level-btn"
            >
              B1 - Intermediate
            </button>
            <button
              onClick={() => setSelectedLevel('B2')}
              className="level-btn"
            >
              B2 - Upper Intermediate
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return <div className="quiz-container"><p>Loading questions...</p></div>;
  }

  const currentQuestion = filteredQuestions[currentIndex];
  const progress = ((currentIndex) / filteredQuestions.length) * 100;

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    onAnswerQuestion(
      currentQuestion.id,
      isCorrect,
      currentQuestion.type,
      currentQuestion.topic,
      currentQuestion.level
    );
    setAnswered(true);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="level-badge">{currentQuestion.level}</div>
        <div className="question-counter">
          {currentIndex + 1} / {filteredQuestions.length}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-meta">
          <span className="badge badge-type">{currentQuestion.type}</span>
          <span className="badge badge-topic">{currentQuestion.topic}</span>
        </div>

        <div className="question-content">
          {currentQuestion.type === 'writing' ? (
            <div className="prompt-section">
              <p className="prompt-text">{currentQuestion.prompt}</p>
            </div>
          ) : currentQuestion.type === 'reading_comprehension' ? (
            <div className="reading-section">
              <p className="reading-text">{currentQuestion.french}</p>
              <p className="question-text">{currentQuestion.question}</p>
            </div>
          ) : (
            <p className="question-text">{currentQuestion.french}</p>
          )}
        </div>

        {currentQuestion.options ? (
          <div className="options">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`option ${
                  selectedAnswer === option ? 'selected' : ''
                } ${
                  answered && option === currentQuestion.correctAnswer
                    ? 'correct'
                    : ''
                } ${
                  answered &&
                  selectedAnswer === option &&
                  option !== currentQuestion.correctAnswer
                    ? 'incorrect'
                    : ''
                }`}
                onClick={() => !answered && handleAnswer(option)}
                disabled={answered}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {showExplanation && (
          <div className={`explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="explanation-header">
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div className="explanation-content">
              <p>
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
              <p>
                <strong>💡 Trick/Mnemonic:</strong> {currentQuestion.trick}
              </p>
              {currentQuestion.englishTranslation && (
                <p>
                  <strong>English:</strong> {currentQuestion.englishTranslation}
                </p>
              )}
              {currentQuestion.readMore && (
                <a
                  href={currentQuestion.readMore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="read-more-link"
                >
                  📖 Read more about this concept
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="quiz-controls">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="control-btn"
        >
          ← Previous
        </button>
        <button
          onClick={() => setSelectedLevel(null)}
          className="control-btn reset-btn"
        >
          Back to Levels
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === filteredQuestions.length - 1}
          className="control-btn"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Quiz;
