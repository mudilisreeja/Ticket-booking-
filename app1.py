from flask import Flask, request, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from reportlab.pdfgen import canvas
from flask_cors import CORS
import io
import datetime
import secrets
import os

app = Flask(__name__)
CORS(app)
app.secret_key = "super-secret-key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/sreej/OneDrive/Desktop/tb/Ticket-booking/newtb.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

    bookings = db.relationship('Booking', backref='user', lazy=True)
    

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    starts_from = db.Column(db.String(100), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    travel_date = db.Column(db.DateTime, nullable=False)
    booking_date = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    adults = db.Column(db.Integer, nullable=False)
    children = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    passengers = db.relationship('Passenger', backref='booking', lazy=True)
    

class Passenger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    is_adult = db.Column(db.Boolean, nullable=False)

# Routes
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Ticket Booking API!"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all([data.get('username'), data.get('email'), data.get('password')]):
        return jsonify({"message": "All fields are required!"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already exists!"}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"message": "Invalid email or password!"}), 401

    session['user_id'] = user.id  # Store user in session
    return jsonify({"message": "Login successful!", "user_id": user.id, "username": user.username}), 200
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User with this email does not exist!"}), 404

    # Generate a secure token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.session.commit()


    reset_link = f"http://127.0.0.1:5000/reset-password?token={reset_token}"
    print(f"Password reset link: {reset_link}")  # This prints the link to the console

    return jsonify({"message": "Password reset link sent to your email!"}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not all([token, new_password]):
        return jsonify({"message": "Token and new password are required!"}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify({"message": "Invalid or expired token!"}), 400

    # Hash the new password and save it
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.password = hashed_password
    user.reset_token = None  # Clear the token after use
    db.session.commit()

    return jsonify({"message": "Password reset successful!"}), 200


@app.route('/api/book', methods=['POST'])
def book_ticket():
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to book tickets!"}), 401

    data = request.get_json()
    new_booking = Booking(
        user_id=session['user_id'],
        starts_from=data['starts_from'],
        destination=data['destination'],
        travel_date=datetime.datetime.strptime(data['travel_date'], '%Y-%m-%d'),
        adults=data['adults'],
        children=data['children'],
        total_price=data['total_price']
    )
    db.session.add(new_booking)
    db.session.commit()

    # Add passengers
    for passenger in data['passengers']:
        new_passenger = Passenger(
            booking_id=new_booking.id,
            name=passenger['name'],
            age=passenger['age'],
            is_adult=passenger['is_adult']
        )
        db.session.add(new_passenger)

    db.session.commit()
    return jsonify({"message": "Booking successful!", "booking_id": new_booking.id}), 201

@app.route('/api/my_bookings', methods=['GET'])
def my_bookings():
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to view your bookings!"}), 401

    user_bookings = Booking.query.filter_by(user_id=session['user_id']).all()
    result = []
    for booking in user_bookings:
        result.append({
            "id": booking.id,
            "starts_from": booking.starts_from,
            "destination": booking.destination,
            "travel_date": booking.travel_date.strftime('%Y-%m-%d'),
            "adults": booking.adults,
            "children": booking.children,
            "total_price": booking.total_price
        })

    return jsonify(result), 200

@app.route('/api/bookings/<int:booking_id>/download', methods=['GET'])
def download_ticket(booking_id):
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to download tickets!"}), 401

    booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first()
    if not booking:
        return jsonify({"message": "Booking not found!"}), 404

    # Generate PDF
    pdf_buffer = io.BytesIO()
    pdf = canvas.Canvas(pdf_buffer)
    pdf.drawString(100, 800, f"Ticket ID: {booking.id}")
    pdf.drawString(100, 780, f"From: {booking.starts_from}")
    pdf.drawString(100, 760, f"To: {booking.destination}")
    pdf.drawString(100, 740, f"Travel Date: {booking.travel_date.strftime('%Y-%m-%d')}")
    pdf.drawString(100, 720, f"Adults: {booking.adults}, Children: {booking.children}")
    pdf.drawString(100, 700, f"Total Price: {booking.total_price}")
    pdf.save()
    pdf_buffer.seek(0)

    return send_file(pdf_buffer, as_attachment=True, download_name=f"ticket_{booking_id}.pdf", mimetype='application/pdf')

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['DELETE'])
def cancel_booking(booking_id):
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to cancel a booking!"}), 401

    booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first()
    if not booking:
        return jsonify({"message": "Booking not found!"}), 404

    # Delete associated passengers first
    Passenger.query.filter_by(booking_id=booking.id).delete()
    db.session.delete(booking)
    db.session.commit()

    return jsonify({"message": "Booking canceled successfully!"}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully!"}), 200

if __name__ == '__main__':
    print("Database absolute path:", os.path.abspath('newtb.db'))
    print(f"Connected DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

    with app.app_context():
        db.create_all()
        print("Tables created!")
    app.run(debug=True)
