from flask import Flask, jsonify, request, session, render_template, url_for
import json
import random
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')

# Load quiz data
def load_quiz_data():
    with open('quiz.json', 'r') as file:
        return json.load(file)

# Select 4 random entries from the JSON file
def select_random_entries(quiz_data, num_entries=4):
    return random.sample(quiz_data, num_entries)

# Get the two movie descriptions from a selected entry
def get_descriptions(entry):
    return entry['movie_desc_1'], entry['movie_desc_2']

# Validate the answer
def validate_answer(entry, user_answer):
    return user_answer == entry['correct']

# Get feedback (movie title and poster path)
def get_feedback(entry):
    return entry['movie_title'], entry['year'], entry['stars'], entry['poster']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_game', methods=['POST'])
def start_game():
    quiz_data = load_quiz_data()
    selected_entries = select_random_entries(quiz_data)
    session['game_data'] = selected_entries
    session['current_question'] = 0
    session['score'] = 0
    return jsonify({'message': 'Game started'})

@app.route('/get_question', methods=['GET'])
def get_question():
    if 'game_data' not in session or session['current_question'] > 4:
        return jsonify({'message': 'Game over'})
    
    current_entry = session['game_data'][session['current_question']]
    desc1, desc2 = get_descriptions(current_entry)
    return jsonify({'desc1': desc1, 'desc2': desc2})

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    if 'game_data' not in session or session['current_question'] > 4:
        return jsonify({'message': 'Game over'})
    
    user_answer = request.json['answer']
    current_entry = session['game_data'][session['current_question']]
    
    is_correct = validate_answer(current_entry, user_answer)
    if is_correct:
        session['score'] += 1
    
    movie_title, year, stars, poster_filename = get_feedback(current_entry)
    poster_path = url_for('static', filename=f'posters/{poster_filename}')
    
    feedback_message = f"That's correct! This film is <i>{movie_title}</i>, from {year} starring {stars}" if is_correct else f"Sorry, that movie has yet to be made. The correct movie is <i>{movie_title}</i> from {year} starring {stars}."

    session['current_question'] += 1
    game_over = session['current_question'] >= 4
    final_score = session['score'] if game_over else None
    
    return jsonify({
        'correct': is_correct,
        'movie_title': movie_title,
        'poster_path': poster_path,
        'current_score': session['score'],
        'game_over': game_over,
        'final_score': final_score,
        'feedback_message': feedback_message
    })

if __name__ == '__main__':
    # This allows the app to work locally and on Render
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)