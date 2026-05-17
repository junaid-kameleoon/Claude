# Using Claude to Help with Your French Learning

This document explains how to share your progress data with Claude so it can provide personalized help.

## 1. Export Your Progress Data

The easiest way to share your learning progress with Claude:

1. Open your French Practice app
2. Click "Analytics" tab
3. Scroll to the bottom
4. Click "📥 Export Progress Data" button
5. A JSON file will download (named like `french-progress-2024-05-17.json`)

## 2. Share with Claude

### Via File Upload (Recommended)
1. Go to [claude.ai](https://claude.ai)
2. Start a new conversation
3. Click the attachment button (paperclip icon)
4. Select your downloaded `french-progress-*.json` file
5. Ask Claude something like:

```
I've attached my French learning progress. Can you:
1. Analyze my strengths and weaknesses
2. Recommend which topics I should focus on next
3. Create a custom practice plan for my weaknesses
4. Generate 5 new practice questions tailored to my level
```

### Via Copy-Paste
If file upload doesn't work:

1. Open your browser DevTools (Press F12)
2. Go to "Console" tab
3. Paste this command:
```javascript
copy(JSON.stringify(JSON.parse(localStorage.getItem('frenchProgress')), null, 2))
```
4. Press Enter
5. Paste the copied data into a Claude chat

## 3. Example Claude Prompts

After sharing your progress, try these:

**For Analysis:**
```
Based on my progress data, which grammar topics should I focus on most? 
Show me areas where my success rate is below 60%.
```

**For Practice:**
```
Create 5 new French conjugation questions at my current level focusing on 
topics where I scored below 70%.
```

**For Learning:**
```
I'm struggling with the subjunctive mood (my success rate is only 40%). 
Can you explain it in a simple way with French examples and English translations?
```

**For Customization:**
```
Based on my progress, what would be a good daily practice plan? 
What topics should I focus on first, second, third?
```

## 4. Data Shared

Your exported file contains:
- ✅ Each question you answered and whether you got it right
- ✅ Topics and grammar areas you're learning
- ✅ Your success rates by category
- ✅ Timestamps of when you studied

This helps Claude understand:
- Your current level
- Your strengths
- Your weaknesses
- Your learning pace

## 5. Privacy Note

- Your data stays on your device (localStorage)
- You control when and what you share
- The JSON file is just your learning stats
- No personal information is recorded (no account needed)

## 6. Regular Updates

For best results:
1. Study for 10-15 questions
2. Export your progress
3. Share with Claude
4. Ask for feedback and new questions
5. Repeat!

## 7. Quick Reference

**Command to view raw data in browser:**
```javascript
console.log(JSON.parse(localStorage.getItem('frenchProgress')))
```

**Command to clear all data (if needed):**
```javascript
localStorage.removeItem('frenchProgress')
```

**Command to backup data:**
```javascript
copy(JSON.stringify(JSON.parse(localStorage.getItem('frenchProgress'))))
```

---

This way, Claude becomes your personal French tutor! 🇫🇷
