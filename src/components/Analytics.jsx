import '../styles/Analytics.css';

function Analytics({ progress }) {
  const calculateSuccessRate = (data) => {
    if (data.answered === 0) return 0;
    return ((data.correct / data.answered) * 100).toFixed(1);
  };

  const getColorForRate = (rate) => {
    if (rate >= 80) return '#22c55e'; // green
    if (rate >= 60) return '#3b82f6'; // blue
    if (rate >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Your Progress Dashboard</h2>
        <p>Total Questions Answered: {progress.totalQuestionsAnswered}</p>
      </div>

      <div className="analytics-grid">
        {/* Success Rate by Question Type */}
        <div className="analytics-card">
          <h3>Success Rate by Question Type</h3>
          <div className="stats-list">
            {Object.entries(progress.stats.byType).map(([type, data]) => (
              <div key={type} className="stat-item">
                <div className="stat-label">
                  {type.replace('_', ' ').toUpperCase()}
                </div>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${calculateSuccessRate(data)}%`,
                      backgroundColor: getColorForRate(
                        calculateSuccessRate(data)
                      ),
                    }}
                  ></div>
                </div>
                <div className="stat-text">
                  {data.correct}/{data.answered} ({calculateSuccessRate(data)}
                  %)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Rate by Level */}
        <div className="analytics-card">
          <h3>Success Rate by Level</h3>
          <div className="stats-list">
            {Object.entries(progress.stats.byLevel).map(([level, data]) => (
              <div key={level} className="stat-item">
                <div className="stat-label">{level}</div>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${calculateSuccessRate(data)}%`,
                      backgroundColor: getColorForRate(
                        calculateSuccessRate(data)
                      ),
                    }}
                  ></div>
                </div>
                <div className="stat-text">
                  {data.correct}/{data.answered} ({calculateSuccessRate(data)}
                  %)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses by Topic */}
        <div className="analytics-card full-width">
          <h3>Strengths & Weaknesses by Topic</h3>
          <div className="topics-grid">
            {Object.entries(progress.stats.byTopic).length > 0 ? (
              Object.entries(progress.stats.byTopic)
                .sort((a, b) => {
                  const rateA = calculateSuccessRate(a[1]);
                  const rateB = calculateSuccessRate(b[1]);
                  return rateB - rateA;
                })
                .map(([topic, data]) => {
                  const rate = calculateSuccessRate(data);
                  const status =
                    rate >= 80
                      ? '💪'
                      : rate >= 60
                      ? '👍'
                      : rate >= 40
                      ? '⚠️'
                      : '🎯';
                  return (
                    <div key={topic} className="topic-card">
                      <div className="topic-header">
                        <span className="topic-status">{status}</span>
                        <span className="topic-name">{topic}</span>
                      </div>
                      <div className="topic-stats">
                        <div className="topic-rate">{rate}%</div>
                        <div className="topic-count">
                          {data.correct}/{data.answered}
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="no-data">
                No data yet. Start answering questions to see your progress!
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="analytics-card">
          <h3>Quick Stats</h3>
          <div className="quick-stats">
            <div className="quick-stat">
              <div className="quick-stat-value">
                {progress.totalQuestionsAnswered}
              </div>
              <div className="quick-stat-label">Questions Answered</div>
            </div>
            <div className="quick-stat">
              <div className="quick-stat-value">
                {(
                  (Object.values(progress.stats.byType).reduce(
                    (acc, data) => acc + data.correct,
                    0
                  ) /
                    Math.max(progress.totalQuestionsAnswered, 1)) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="quick-stat-label">Overall Success Rate</div>
            </div>
            <div className="quick-stat">
              <div className="quick-stat-value">
                {Object.keys(progress.stats.byTopic).length}
              </div>
              <div className="quick-stat-label">Topics Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Data Button */}
      <div className="export-section">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(progress, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `french-progress-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
          }}
          className="export-btn"
        >
          📥 Export Progress Data
        </button>
      </div>
    </div>
  );
}

export default Analytics;
