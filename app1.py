import re
from flask import Flask, request, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from reportlab.pdfgen import canvas
from flask_cors import CORS
from flask import request
import io
import datetime
import secrets
import os
from price_data import priceMatrix
from functools import wraps
import jwt
import requests
from sqlalchemy import func

app = Flask(__name__)

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Please log in to book the Ticket!"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Configure CORS
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "supports_credentials": True
}})

# Configure CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# App configuration
app.secret_key = "super-secret-key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/sreej/OneDrive/Desktop/tb/Ticket-booking/newtb.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_DOMAIN'] = None

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Keycloak configuration
KEYCLOAK_URL = "http://localhost:8080"
KEYCLOAK_REALM = "bus-booking"
KEYCLOAK_CLIENT_ID = "bus-booking-client"
KEYCLOAK_CLIENT_SECRET = "4Y9SXmvITYBXj5yRGhVvZF5JZqiOxqtD"  # Replace with your actual client secret

def get_keycloak_public_key():
    try:
        response = requests.get(f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/.well-known/openid-configuration")
        if response.status_code != 200:
            print(f"Failed to get openid configuration: {response.status_code}")
            return None
            
        openid_config = response.json()
        jwks_uri = openid_config['jwks_uri']
        
        response = requests.get(jwks_uri)
        if response.status_code != 200:
            print(f"Failed to get JWKS: {response.status_code}")
            return None
            
        return response.json()["keys"][0]["n"]
    except Exception as e:
        print(f"Error getting public key: {str(e)}")
        return None

def verify_token(token):
    try:
        public_key = get_keycloak_public_key()
        if not public_key:
            print("Failed to get public key")
            return None
            
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID,
            issuer=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
        )
        return decoded
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'is_admin' not in session or not session['is_admin']:
            return jsonify({"message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
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
    status = db.Column(db.String(20), nullable=False, default='pending')
    passengers = db.relationship('Passenger', backref='booking', lazy=True)
    

class Passenger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    is_adult = db.Column(db.Boolean, nullable=False)
    id_type = db.Column(db.String(20))
    id_number = db.Column(db.String(20))

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    payment_date = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    booking = db.relationship('Booking', backref='payment', uselist=False)

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
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"message": "Email and password are required!"}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        # Regular user authentication
        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password, password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # Check if this is the admin email
        ADMIN_EMAIL = "sreeja.mudili@gmail.com"  # Admin email
        is_admin = email == ADMIN_EMAIL

        session['user_id'] = user.id
        session['is_admin'] = is_admin
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": is_admin
            }
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Login failed!"
        }), 500

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'logged_in': True,
                'user_id': user.id,
                'username': user.username
            }), 200
        else:
            # Clear invalid session
            session.clear()
    
    # Not logged in is a valid state, return 200
    return jsonify({
        'logged_in': False
    }), 200

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


@app.route('/api/book', methods=['POST', 'OPTIONS'])
def book_ticket():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        print("Session contents:", dict(session))
        print("User ID in session:", session.get('user_id'))
        
        if 'user_id' not in session:
            return jsonify({"message": "Please log in to book tickets!"}), 401
        
        data = request.get_json()
        print("Received booking data:", data)  # Debug print
        
        if not data:
            return jsonify({"message": "No data provided"}), 400

        # Validate required fields
        required_fields = ['startsFrom', 'destination', 'travelDate', 'adults', 'children', 'passengers']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Validate cities
        valid_cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 
                      'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat']
        
        if data['startsFrom'] not in valid_cities:
            return jsonify({"message": f"Invalid departure city: {data['startsFrom']}"}), 400
        
        if data['destination'] not in valid_cities:
            return jsonify({"message": f"Invalid destination city: {data['destination']}"}), 400
        
        if data['startsFrom'] == data['destination']:
            return jsonify({"message": "Departure and destination cities cannot be the same!"}), 400
        
        # Convert string values to integers
        try:
            adults = int(data.get('adults', 0))
            children = int(data.get('children', 0))
        except ValueError as e:
            return jsonify({"message": f"Invalid passenger numbers: {str(e)}"}), 400
        
        # Calculate total price
        route_key = f"{data['startsFrom']}-{data['destination']}"
        base_price = priceMatrix.get(route_key, 0)
        if base_price == 0:
            return jsonify({"message": f"No price found for route: {route_key}"}), 400
            
        total_passengers = adults + children
        total_price = base_price * total_passengers
        
        # Validate travel date
        try:
            travel_date = datetime.datetime.strptime(data['travelDate'], '%Y-%m-%d')
            if travel_date.date() < datetime.datetime.now().date():
                return jsonify({"message": "Travel date cannot be in the past"}), 400
        except (ValueError, KeyError) as e:
            return jsonify({"message": f"Invalid travel date format: {str(e)}"}), 400
        
        # Validate passengers data
        if not isinstance(data['passengers'], list):
            return jsonify({"message": "Passengers must be a list"}), 400
            
        if len(data['passengers']) != total_passengers:
            return jsonify({"message": f"Number of passenger details ({len(data['passengers'])}) does not match total passengers ({total_passengers})"}), 400

        # Create booking
        try:
            new_booking = Booking(
                user_id=session['user_id'],
                starts_from=data['startsFrom'],
                destination=data['destination'],
                travel_date=travel_date,
                adults=adults,
                children=children,
                total_price=total_price,
                status='confirmed'  # Set status as confirmed immediately
            )
            db.session.add(new_booking)
            db.session.flush()  # Get the booking ID without committing

            # Add passengers
            for passenger_data in data['passengers']:
                try:
                    age = int(passenger_data.get('age', 0))
                    new_passenger = Passenger(
                        booking_id=new_booking.id,
                        name=passenger_data.get('name', '').strip(),
                        age=age,
                        is_adult=passenger_data.get('isAdult', age >= 18),
                        id_type=passenger_data.get('idType'),
                        id_number=passenger_data.get('idNumber')
                    )
                    if not new_passenger.name:
                        raise ValueError(f"Missing name for passenger")
                    if age < 0 or age > 120:
                        raise ValueError(f"Invalid age ({age}) for passenger {new_passenger.name}")
                    db.session.add(new_passenger)
                except (KeyError, ValueError, TypeError) as e:
                    db.session.rollback()
                    return jsonify({"message": f"Invalid passenger data: {str(e)}"}), 400

            db.session.commit()
            return jsonify({
                "message": "Booking created successfully!", 
                "booking_id": new_booking.id,
                "total_price": total_price
            }), 201

        except Exception as e:
            db.session.rollback()
            print(f"Database error in booking creation: {str(e)}")
            return jsonify({"message": f"Database error: {str(e)}"}), 500

    except Exception as e:
        print(f"Error in book_ticket: {str(e)}")
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/api/mybookings', methods=['GET'])
@login_required
def my_bookings():
    try:
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
                "total_price": booking.total_price,
                "status": booking.status
            })

        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching bookings: {str(e)}")
        return jsonify({"message": "Failed to fetch bookings"}), 500

@app.route('/api/bookings/<int:booking_id>/download', methods=['GET'])
def download_ticket(booking_id):
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to download tickets!"}), 401

    booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first()
    if not booking:
        return jsonify({"message": "Booking not found!"}), 404

    # Generate PDF
    pdf_buffer = io.BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=(612, 792))  # A4 size

    # Add header
    pdf.setFillColorRGB(0.2, 0.4, 0.8)
    pdf.rect(0, 750, 612, 40, fill=True)
    pdf.setFillColorRGB(1, 1, 1)
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(50, 765, "TRAVEL TICKET")

    # Add ticket details
    pdf.setFillColorRGB(0, 0, 0)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(50, 700, f"Ticket ID: {booking.id}")
    pdf.drawString(50, 680, f"Booking Date: {booking.booking_date.strftime('%Y-%m-%d %H:%M')}")

    # Add journey details
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, 650, "Journey Details")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(70, 630, f"From: {booking.starts_from}")
    pdf.drawString(70, 610, f"To: {booking.destination}")
    pdf.drawString(70, 590, f"Travel Date: {booking.travel_date.strftime('%Y-%m-%d')}")

    # Add passenger count
    pdf.drawString(70, 570, f"Total Passengers: {booking.adults + booking.children}")
    pdf.drawString(70, 550, f"Adults: {booking.adults}, Children: {booking.children}")

    # Add price details
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, 520, "Price Details")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(70, 500, f"Total Price: ₹{booking.total_price}")

    # Add passenger details
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, 470, "Passenger Details")
    pdf.setFont("Helvetica", 10)
    y = 450
    for passenger in booking.passengers:
        pdf.drawString(70, y, f"Name: {passenger.name}")
        pdf.drawString(70, y-15, f"Age: {passenger.age} ({'Adult' if passenger.is_adult else 'Child'})")
        y -= 30

    # Add footer
    pdf.setFillColorRGB(0.2, 0.4, 0.8)
    pdf.rect(0, 0, 612, 40, fill=True)
    pdf.setFillColorRGB(1, 1, 1)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, 20, "Thank you for choosing our service!")
    pdf.drawString(50, 10, "For any queries, please contact our support team.")

    pdf.save()
    pdf_buffer.seek(0)

    return send_file(pdf_buffer, as_attachment=True, download_name=f"ticket_{booking_id}.pdf", mimetype='application/pdf')

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['DELETE'])
@login_required
def cancel_booking(booking_id):
    try:
        booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first()
        if not booking:
            return jsonify({"message": "Booking not found"}), 404

        if booking.status == 'cancelled':
            return jsonify({"message": "Booking is already cancelled"}), 400

        booking.status = 'cancelled'
        db.session.commit()

        return jsonify({"message": "Booking cancelled successfully"}), 200
    except Exception as e:
        print(f"Error cancelling booking: {str(e)}")
        db.session.rollback()
        return jsonify({"message": "Failed to cancel booking"}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully!"}), 200

@app.route('/api/payment/initiate', methods=['POST'])
def initiate_payment():
    if 'user_id' not in session:
        return jsonify({"message": "Please log in to make payment!"}), 401
    
    data = request.get_json()
    booking_id = data.get('booking_id')
    payment_method = data.get('payment_method')
    
    if not all([booking_id, payment_method]):
        return jsonify({"message": "Booking ID and payment method are required!"}), 400
    
    booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first()
    if not booking:
        return jsonify({"message": "Booking not found!"}), 404
    
    if booking.status != 'pending':
        return jsonify({"message": "Booking is already paid or cancelled!"}), 400
    
    # Generate a unique transaction ID
    transaction_id = f"TXN_{int(datetime.datetime.utcnow().timestamp())}_{booking_id}"
    
    # Create payment record
    payment = Payment(
        booking_id=booking_id,
        amount=booking.total_price,
        payment_method=payment_method,
        transaction_id=transaction_id
    )
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        "message": "Payment initiated successfully!",
        "transaction_id": transaction_id,
        "amount": booking.total_price
    }), 200

@app.route('/api/payment/confirm', methods=['POST'])
@login_required
def confirm_payment():
    try:
        data = request.get_json()
        booking_id = data.get('booking_id')
        transaction_id = data.get('transaction_id')
        payment_method = data.get('payment_method')
        amount = data.get('amount')

        if not all([booking_id, transaction_id, payment_method, amount]):
            return jsonify({'message': 'Missing required fields'}), 400

        # Get the booking
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404

        if booking.user_id != session['user_id']:
            return jsonify({'message': 'Unauthorized access'}), 403

        # Create payment record
        payment = Payment(
            booking_id=booking_id,
            transaction_id=transaction_id,
            payment_method=payment_method,
            amount=amount,
            status='completed'
        )
        db.session.add(payment)
        
        # Update booking status
        booking.status = 'confirmed'
        db.session.commit()

        return jsonify({
            'message': 'Payment confirmed successfully',
            'booking_id': booking_id,
            'transaction_id': transaction_id,
            'status': 'confirmed'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Payment confirmation error: {str(e)}")
        return jsonify({'message': 'Failed to confirm payment'}), 500

@app.route('/api/admin', methods=['GET'])
@admin_required
def admin_dashboard():
    try:
        # Get total bookings and revenue
        total_bookings = Booking.query.count()
        total_revenue = db.session.query(func.sum(Booking.total_price)).scalar() or 0

        # Get route statistics
        route_stats = db.session.query(
            Booking.starts_from,
            Booking.destination,
            func.count(Booking.id).label('total_bookings'),
            func.sum(Booking.total_price).label('revenue')
        ).group_by(Booking.starts_from, Booking.destination).all()

        # Format route stats
        formatted_route_stats = []
        for route in route_stats:
            formatted_route_stats.append({
                'route': f"{route.starts_from} → {route.destination}",
                'totalBookings': route.total_bookings,
                'revenue': float(route.revenue or 0),
                'occupancy': 100  # You can calculate this based on your bus capacity
            })

        # Get recent bookings
        recent_bookings = Booking.query.order_by(Booking.booking_date.desc()).limit(10).all()
        formatted_recent_bookings = []
        for booking in recent_bookings:
            formatted_recent_bookings.append({
                'id': booking.id,
                'username': booking.user.username,
                'starts_from': booking.starts_from,
                'destination': booking.destination,
                'travel_date': booking.travel_date.strftime('%Y-%m-%d'),
                'total_price': float(booking.total_price),
                'status': booking.status
            })

        return jsonify({
            'totalBookings': total_bookings,
            'totalRevenue': float(total_revenue),
            'routeStats': formatted_route_stats,
            'recentBookings': formatted_recent_bookings
        })

    except Exception as e:
        print(f"Error getting admin dashboard data: {str(e)}")
        return jsonify({"message": "Failed to get admin dashboard data"}), 500

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    try:
        # Get total bookings and revenue
        total_bookings = Booking.query.count()
        total_revenue = db.session.query(func.sum(Booking.total_price)).scalar() or 0

        # Get route statistics
        route_stats = db.session.query(
            Booking.starts_from,
            Booking.destination,
            func.count(Booking.id).label('total_bookings'),
            func.sum(Booking.total_price).label('revenue')
        ).group_by(Booking.starts_from, Booking.destination).all()

        # Format route stats
        formatted_route_stats = []
        for route in route_stats:
            formatted_route_stats.append({
                'route': f"{route.starts_from} → {route.destination}",
                'totalBookings': route.total_bookings,
                'revenue': float(route.revenue or 0),
                'occupancy': 100  # You can calculate this based on your bus capacity
            })

        # Get recent bookings
        recent_bookings = Booking.query.order_by(Booking.booking_date.desc()).limit(10).all()
        formatted_recent_bookings = []
        for booking in recent_bookings:
            formatted_recent_bookings.append({
                'id': booking.id,
                'username': booking.user.username,
                'starts_from': booking.starts_from,
                'destination': booking.destination,
                'travel_date': booking.travel_date.strftime('%Y-%m-%d'),
                'total_price': float(booking.total_price),
                'status': booking.status
            })

        return jsonify({
            'totalBookings': total_bookings,
            'totalRevenue': float(total_revenue),
            'routeStats': formatted_route_stats,
            'recentBookings': formatted_recent_bookings
        })

    except Exception as e:
        print(f"Error getting admin stats: {str(e)}")
        return jsonify({"message": "Failed to get admin statistics"}), 500

@app.route('/api/admin/bookings', methods=['GET'])
@admin_required
def get_all_bookings():
    try:
        bookings = Booking.query.order_by(Booking.booking_date.desc()).all()
        return jsonify([{
            'id': booking.id,
            'username': booking.user.username,
            'starts_from': booking.starts_from,
            'destination': booking.destination,
            'travel_date': booking.travel_date.strftime('%Y-%m-%d'),
            'total_price': float(booking.total_price),
            'status': booking.status
        } for booking in bookings])
    except Exception as e:
        print(f"Error getting all bookings: {str(e)}")
        return jsonify({"message": "Failed to get bookings"}), 500

@app.route('/api/admin/bookings/<int:booking_id>/status', methods=['PUT'])
@admin_required
def update_booking_status(booking_id):
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({"message": "Status is required"}), 400

        booking = Booking.query.get_or_404(booking_id)
        booking.status = data['status']
        db.session.commit()

        return jsonify({"message": "Booking status updated successfully"})
    except Exception as e:
        print(f"Error updating booking status: {str(e)}")
        return jsonify({"message": "Failed to update booking status"}), 500

if __name__ == '__main__':
    print("Database absolute path:", os.path.abspath('newtb.db'))
    print(f"Connected DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

    with app.app_context():
        db.create_all()
        print("Tables created!")
    app.run(debug=True)
