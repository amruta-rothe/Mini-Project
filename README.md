# AttendanceMS

A web based attendance management system built with Node.js and SQLite.

## About

This project is a web based attendance management system built with Node.js and SQLite. It allows teachers to mark attendance for students and generate reports. The system also allows students to view their attendance and parents to view their child's attendance.

## Features

- Teacher can mark attendance for students
- Teacher can view attendance reports
- Teacher can add/edit/delete students
- Teacher can add/edit/delete classes
- Teacher can add/edit/delete subjects
- Student can view their attendance
- Parent can view their child's attendance
- Admin can manage teachers, students, classes, subjects
- Email notifications to parents when student is absent
- SMS notifications to parents when student is absent (optional)
- Export attendance reports to PDF and Excel
- Import students from CSV file
- Responsive design

## Technology Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Libraries**: jQuery, Chart.js, EJS
- **Email**: Nodemailer
- **SMS**: Twilio API (optional)

## Requirements

- Node.js (v18 or higher)
- npm

## Installation

1. Clone the repository
```bash
git clone https://github.com/Mayuri2428/Mini-Project.git
```

2. Navigate to the project directory
```bash
cd Mini-Project
```

3. Install dependencies
```bash
npm install
```

4. Initialize the database
```bash
npm run db:init
npm run db:seed
```

5. Copy the environment file
```bash
cp .env.example .env
```

6. Configure the environment variables in `.env` file
```env
SESSION_SECRET=your_session_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="School Attendance <no-reply@school.com>"
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_FROM=+1234567890
```

7. Start the server
```bash
npm start
```

8. Open your browser and go to `http://localhost:3000`

## Default Login Credentials

- **Email**: mjsfutane21@gmail.com
- **Password**: abc@1234

## Screenshots

### Login Page
![Login Page](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Mark Attendance
![Mark Attendance](screenshots/mark-attendance.png)

### View Attendance
![View Attendance](screenshots/view-attendance.png)

### Reports
![Reports](screenshots/reports.png)

## Database Schema

The system uses SQLite database with the following tables:

- **teachers** - Store teacher information
- **classes** - Store class information  
- **students** - Store student information
- **attendance** - Store attendance records
- **periods** - Store class periods

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, feel free to reach out:

- **Email**: mjsfutane21@gmail.com
- **GitHub**: [Mayuri2428](https://github.com/Mayuri2428)
