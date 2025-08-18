# Diaspora Concierge Hub for Eleos Groups

A multilingual web-based platform that helps the Ethiopian diaspora plan and pre-pay for services in Ethiopia, including travel logistics, property management, business setup support, and secure online payments. Built as a Virginia Tech Capstone project in partnership with Eleos Groups.

##  Project Summary

The Diaspora Concierge Hub is a web-based service platform that connects members of the Ethiopian diaspora with trusted travel and property services in Ethiopia. The app allows users to register, submit service requests (e.g., airport pickup, lodging, office rental), plan their trips, AI-powered estimate costs, and complete payments online, through Flutterwave and Paypal — all within a multilingual (English/Amharic) interface. An admin dashboard provides backend access to manage requests and service content.

## Technology Stack

### Frontend: 
React.js with Vite, Tailwind CSS, ShadeCN UI components
### Backend: 
Supabase (Database, Authentication, Storage), FastAPI with Uvicorn
### AI/ML: 
OpenRouter API with Mistral model for travel cost estimation
### Payments: 
PayPal Developer API, Flutterwave
### Email: 
Supabase Edge Functions with Resend for notifications

## Getting Started

### 1. Clone the Repository

Use the command git clone < web-URL-from-the-github> to clone the repo and cd eleos-capstone to go into the project folder. 

### 2. Frontend Setup

- Navigate to the client folder and install dependencies:
    - bashcd client
    - npm install
- Create a .env file in the client directory:
    - envVITE_SUPABASE_URL=your_supabase_project_url
    - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

### 3. Backend Setup 

- Navigate to the server folder and set up the Python environment:
    - bashcd server
    - python -m venv venv
    - source venv/bin/activate  # On Windows: venv\Scripts\activate
- pip install -r requirements.txt
- Create a .env file in the server directory:
    - envOPENROUTER_API_KEY=your_openrouter_api_key

### 4. Run the Developer Server

- Start the frontend server:
    - bashcd client
    - npm run dev
- Start the backend server:
    - bashcd server
    - uvicorn main:app --reload
- The application will be available at http://localhost:5173 with the API at http://localhost:8000.

## Features

- Multilingual interface (English/Amharic)
- User registration and authentication
- Service request forms for travel, property, and business needs
- AI-powered travel cost estimation
- Secure payment processing via PayPal and Flutterwave
- User dashboard for managing requests
- Admin portal for service and request management
- Email notifications for invoice updates
- Export functionality for reports

## Team 

Mary Zeno (maryzeno@vt.edu)

Neha Bangari (nehabangari@vt.edu)

Sruthi Vempuluru (sruthiv@vt.edu)

Vrinda Valaboju (vrindav@vt.edu)

## License

This project is licensed under the MIT License.
