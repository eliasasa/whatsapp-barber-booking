# WhatsApp Barber Booking

## Project Description
The WhatsApp Barber Booking application enables users to schedule appointments with barbers through WhatsApp. The app streamlines the booking process, making it easier for customers to manage their hair appointments conveniently from their mobile devices.

## Features
- User authentication via WhatsApp.
- Browse available barbers and their services.
- Schedule, reschedule, and cancel appointments.
- Receive confirmation messages via WhatsApp.
- View appointment history.

## Architecture
The application follows a microservices architecture comprising:
- **Frontend**: Built using React for dynamic user interaction.
- **Backend**: Node.js and Express API to handle requests and manage data.
- **Database**: MongoDB to store user data, appointment details, and barber information.
- **Messaging Service**: Twilio API to send and receive WhatsApp messages.

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/eliasasa/whatsapp-barber-booking.git
   cd whatsapp-barber-booking
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set environment variables**:
   Create a `.env` file in the root directory and add the following:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   MONGODB_URI=your_mongodb_uri
   ```
4. **Run the application**:
   ```bash
   npm start
   ```

## API Endpoints
- **GET /api/barbers**: List all available barbers.
- **POST /api/appointment**: Schedule a new appointment.
- **GET /api/appointment/:id**: Get details of a specific appointment.
- **DELETE /api/appointment/:id**: Cancel an existing appointment.

## Usage Examples
### Scheduling an Appointment
To schedule an appointment, send a POST request to `/api/appointment` with the following JSON body:
```json
{
   "user_id": "12345",
   "barber_id": "67890",
   "appointment_time": "2026-03-26T14:00:00Z"
}
```

### Canceling an Appointment
To cancel an appointment, send a DELETE request to `/api/appointment/12345` (replace with the actual appointment ID).

For more details, please refer to the API documentation available in the documentation folder or at the project’s wiki page.