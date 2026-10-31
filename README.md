# 🧠 Quiz App

An interactive quiz application that shows one question at a time, gives instant visual feedback on each answer, tracks your score, and ends with a final result. Every question has its own countdown timer, so you have to answer quickly. Built with HTML, CSS, and vanilla JavaScript, with no frameworks or dependencies.

🔗 **Live Demo:** https://zaidquiz.netlify.app/

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

<!-- Add a screenshot or GIF: ![Quiz app preview](preview.png) -->

## ✨ Features

- **Dynamic question rendering**: questions and answer options are generated from a JavaScript data array
- **Countdown timer per question**: a live timer runs for each question and moves the quiz forward when time runs out
- **Instant visual feedback**: the selected answer is marked correct or wrong right away, and the correct option is revealed
- **Score tracking**: the score updates as you answer
- **Quiz navigation**: move through the questions step by step
- **Final result screen**: see your total score at the end, with an option to restart
- **Responsive layout**: works on phones, tablets, and desktops

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 |
| Styling | CSS3 (flexbox, transitions, responsive design) |
| Logic | Vanilla JavaScript (DOM manipulation, event handling, `setInterval`) |

## 🎯 What This Project Demonstrates

- Rendering dynamic UI from data with the DOM
- Handling user events (answer selection, next question, restart)
- Managing application state (current question, score, timer)
- Using `setInterval` and `clearInterval` for timers
- Giving users instant feedback with CSS classes and transitions

## 🚀 Getting Started

No installation or build step is needed.

```bash
# Clone the repository
git clone https://github.com/zaidshaikh5301/quiz_app.git

# Move into the project folder
cd quiz_app
```

Then open `index.html` in your browser, or serve it with the VS Code **Live Server** extension.

## 🎮 How to Play

1. Open the app and start the quiz.
2. Read the question and pick an answer before the timer runs out.
3. See instantly whether you were right, then move to the next question.
4. At the end, check your final score and play again.

## 📁 Project Structure

```
quiz_app/
├── index.html    # Quiz layout and markup
├── style.css     # Styling, feedback states, and responsive rules
├── script.js     # Questions, timer, scoring, and quiz logic
└── README.md
```

## ✏️ Customizing the Quiz

Questions live in an array at the top of `script.js`. To add your own, follow the same structure:

```javascript
{
  question: "Your question here?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answer: "Option B"
}
```

> Match the field names to whatever your `script.js` actually uses.

To change the time allowed per question, edit the timer value in `script.js`.

## 🗺️ Future Improvements

- Add question categories and difficulty levels
- Save high scores with `localStorage`
- Load questions from an API (for example, Open Trivia DB)
- Add sound effects and a progress bar
- Shuffle questions and answer options

## 👤 Author

**Zaid Shaikh**
GitHub: [@zaidshaikh5301](https://github.com/zaidshaikh5301)

## 📄 License

This project is licensed under the [MIT License](LICENSE).
