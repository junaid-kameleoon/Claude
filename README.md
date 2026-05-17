# 🇫🇷 French Practice - Interactive Learning Platform

A personalized French language practice website designed to help you track your progress and master French at A2, B1, and B2 levels.

## Features

✨ **Adaptive Question Bank**
- 40+ curated questions compiled from DELF, TCF, and other official French tests
- Coverage: A2 (Elementary) → B1 (Intermediate) → B2 (Upper Intermediate)
- Question types: Conjugation, Vocabulary, Reading Comprehension, Translation, Writing

📊 **Comprehensive Analytics Dashboard**
- Track success rate by question type
- Monitor strengths & weaknesses by grammar topic
- View progress by proficiency level
- Export progress data as JSON for external use

💾 **Smart Progress Tracking**
- All progress stored in browser localStorage (no account needed)
- Persistent data across sessions
- Easy data export for backup or external analysis

🎯 **Enhanced Learning**
- English explanations for every answer
- Memory tricks and mnemonics to help retention
- Links to detailed concept explanations
- Immediate feedback on correct/incorrect answers

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Taking a Quiz

1. **Select Your Level**: Choose from A2, B1, or B2
2. **Answer Questions**: Pick from multiple choice or follow writing prompts
3. **Review Answers**: See explanations, tricks, and additional resources
4. **Track Progress**: Navigate to Analytics to see your performance

### Understanding the Analytics Dashboard

**Success Rate by Question Type**
- Shows your performance in each category:
  - Conjugation (verb forms)
  - Vocabulary (gender, nouns, adjectives)
  - Reading Comprehension
  - Translation (English to French)
  - Writing (free form)

**Success Rate by Level**
- Compare your performance across A2, B1, B2

**Strengths & Weaknesses by Topic**
- Topics are automatically created as you answer questions
- Status indicators:
  - 💪 80%+ = Strong
  - 👍 60-79% = Good
  - ⚠️ 40-59% = Needs work
  - 🎯 <40% = Priority focus

### Exporting Your Progress

Click **"📥 Export Progress Data"** in the Analytics dashboard to download your complete progress history as a JSON file.

## How Claude Can Access Your Progress

Your progress data is stored in browser localStorage. To allow Claude to help with your learning:

### Option 1: Share Progress File
1. Go to Analytics → "Export Progress Data"
2. Save the JSON file
3. Share the file with Claude
4. Claude can analyze your weaknesses and create personalized practice sessions

### Option 2: Copy Progress Data
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `copy(JSON.stringify(JSON.parse(localStorage.getItem('frenchProgress')), null, 2))`
4. Paste into Claude chat
5. Claude can analyze and suggest practice areas

## Tech Stack

- **Frontend**: React 18 + Vite
- **Storage**: Browser localStorage
- **Styling**: CSS3 with responsive design

## Getting Started with Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

**Happy learning! Bonne chance! 🇫🇷**
