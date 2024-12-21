let currentQuestion = 1;
let totalScore = 0;

document.getElementById("start-game").addEventListener("click", startGame);
document
  .getElementById("answer1")
  .addEventListener("click", () => submitAnswer(1));
document
  .getElementById("answer2")
  .addEventListener("click", () => submitAnswer(2));

function startGame() {
  fetch("/start_game", { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === "Game started") {
        document.getElementById("intro-container").style.display = "none";
        document.getElementById("game-container").style.display = "block";
        getQuestion();
      } else {
        console.error("Failed to start game:", data.message);
      }
    })
    .catch((error) => console.error("Error starting game:", error));
}

function getQuestion() {
  fetch("/get_question")
    .then((response) => response.json())
    .then((data) => {
      if (data.message === "Game over") {
        endGame();
      } else {
        document.getElementById("round-number").textContent = currentQuestion;
        document.getElementById("desc1").textContent = data.desc1;
        document.getElementById("desc2").textContent = data.desc2;
        document.getElementById("answer1").disabled = false;
        document.getElementById("answer2").disabled = false;
        document.getElementById("result").textContent = "";
        document.getElementById("poster").style.display = "none";
        document.getElementById("next-round").style.display = "none";
      }
    })
    .catch((error) => console.error("Error getting question:", error));
}

function submitAnswer(answer) {
  const answer1Button = document.getElementById("answer1");
  const answer2Button = document.getElementById("answer2");

  // Disable both buttons
  answer1Button.disabled = true;
  answer2Button.disabled = true;

  // Add a class to the selected answer
  document.getElementById(`answer${answer}`).classList.add("selected-answer");

  fetch("/submit_answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer: answer }),
  })
    .then((response) => response.json())
    .then((data) => {
      const resultElement = document.getElementById("result");
      resultElement.innerHTML = data.feedback_message;
      resultElement.classList.toggle("incorrect-feedback", !data.correct);

      // Highlight the correct answer
      const correctDescElement = document.getElementById(
        data.correct ? `desc${answer}` : `desc${3 - answer}`
      );
      correctDescElement.classList.add("correct-answer");

      // Fade out the placeholder
      const placeholder = document.getElementById("placeholder");
      placeholder.style.opacity = "0";
      placeholder.style.transition = "opacity 0.3s ease-out";

      // After the fade-out, update and show the new poster
      setTimeout(() => {
        placeholder.style.display = "none";
        const poster = document.getElementById("poster");
        poster.src = data.poster_path;
        poster.style.opacity = "0";
        poster.style.display = "block";

        // Force a reflow to ensure the opacity transition works
        poster.offsetHeight;

        poster.style.opacity = "1";
        poster.style.transition = "opacity 0.3s ease-in";

        // Scroll to the top of the game container
        const gameContainer = document.getElementById("game-container");
        gameContainer.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);

      if (data.game_over) {
        document.getElementById("next-round").textContent = "See Final Score";
        document.getElementById("next-round").onclick = () =>
          endGame(data.final_score);
      } else {
        document.getElementById("next-round").textContent = "Next Round";
        document.getElementById("next-round").onclick = nextRound;
      }
      document.getElementById("next-round").style.display = "block";
    })
    .catch((error) => console.error("Error submitting answer:", error));
}

function nextRound() {
  currentQuestion++;

  // Fade out the current poster
  const poster = document.getElementById("poster");
  poster.style.opacity = "0";
  poster.style.transition = "opacity 0.3s ease-out";

  // Remove highlighting from previous correct answer
  document
    .querySelectorAll(".correct-answer")
    .forEach((el) => el.classList.remove("correct-answer"));

  // After the fade-out, show the placeholder and get the next question
  setTimeout(() => {
    poster.style.display = "none";
    const placeholder = document.getElementById("placeholder");
    placeholder.style.opacity = "0";
    placeholder.style.display = "block";

    // Force a reflow to ensure the opacity transition works
    placeholder.offsetHeight;
    placeholder.style.opacity = "1";
    placeholder.style.transition = "opacity 0.3s ease-in";
    getQuestion();
  }, 300);
}
function endGame(finalScore) {
  const gameContainer = document.getElementById("game-container");
  gameContainer.classList.add("game-over");

  let message;
  if (finalScore <= 1) {
    message =
      "You did worse than statistically likely. Make a list of Christmas films, check it twice, and get on that sofa!";
  } else if (finalScore <= 3) {
    message = "Well done, little elf!";
  } else {
    message = "Wow, slay queen! (Christmas pun for free!)";
  }

  gameContainer.innerHTML = `
<h2>${message}</h2>
<div class="final-score">You scored ${finalScore}/4</div>
<button onclick="location.reload()">Play Again</button>
`;
}
