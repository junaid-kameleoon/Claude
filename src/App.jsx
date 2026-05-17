import { useState, useEffect } from 'react';
import './App.css';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import questionsData from './data/questions.json';

function App() {
  const [currentView, setCurrentView] = useState('quiz');
  const [progress, setProgress] = useState(null);
  const [questions, setQuestions] = useState(questionsData.questions);

  useEffect(() => {
    // Load progress from localStorage
    const stored = localStorage.getItem('frenchProgress');
    if (stored) {
      setProgress(JSON.parse(stored));
    } else {
      // Initialize with default progress
      const defaultProgress = {
        sessions: [],
        totalQuestionsAnswered: 0,
        startDate: new Date().toISOString(),
        stats: {
          byType: {
            conjugation: { answered: 0, correct: 0 },
            vocabulary: { answered: 0, correct: 0 },
            reading_comprehension: { answered: 0, correct: 0 },
            translation: { answered: 0, correct: 0 },
            writing: { answered: 0, correct: 0 }
          },
          byTopic: {},
          byLevel: {
            A2: { answered: 0, correct: 0 },
            B1: { answered: 0, correct: 0 },
            B2: { answered: 0, correct: 0 }
          }
        }
      };
      setProgress(defaultProgress);
      localStorage.setItem('frenchProgress', JSON.stringify(defaultProgress));
    }
  }, []);

  const updateProgress = (questionId, isCorrect, type, topic, level) => {
    setProgress(prev => {
      const updated = { ...prev };

      // Initialize topic if not exists
      if (!updated.stats.byTopic[topic]) {
        updated.stats.byTopic[topic] = { answered: 0, correct: 0 };
      }

      // Update stats
      updated.stats.byType[type].answered += 1;
      updated.stats.byType[type].correct += isCorrect ? 1 : 0;

      updated.stats.byTopic[topic].answered += 1;
      updated.stats.byTopic[topic].correct += isCorrect ? 1 : 0;

      updated.stats.byLevel[level].answered += 1;
      updated.stats.byLevel[level].correct += isCorrect ? 1 : 0;

      updated.totalQuestionsAnswered += 1;

      // Record session
      updated.sessions.push({
        questionId,
        isCorrect,
        timestamp: new Date().toISOString(),
        type,
        topic,
        level
      });

      localStorage.setItem('frenchProgress', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">🇫🇷 French Practice</h1>
          <div className="nav-buttons">
            <button
              className={`nav-btn ${currentView === 'quiz' ? 'active' : ''}`}
              onClick={() => setCurrentView('quiz')}
            >
              Quiz
            </button>
            <button
              className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentView('analytics')}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {progress && (
          currentView === 'quiz' ? (
            <Quiz
              questions={questions}
              onAnswerQuestion={updateProgress}
              progress={progress}
            />
          ) : (
            <Analytics progress={progress} />
          )
        )}
      </main>
    </div>
  );
}

export default App;
