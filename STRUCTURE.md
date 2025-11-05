# Project Structure

```
AttendanceMS/
├── src/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── dashboard.js     # Dashboard routes
│   │   ├── attendance.js    # Attendance management routes
│   │   ├── reports.js       # Reports generation routes
│   │   ├── import.js        # CSV import routes
│   │   ├── periods.js       # Period management routes
│   │   ├── manage.js        # Management routes
│   │   ├── api.js          # API endpoints
│   │   └── insights.js      # Analytics routes
│   ├── views/
│   │   ├── dashboard.ejs    # Dashboard template
│   │   ├── login.ejs        # Login template
│   │   ├── home.ejs         # Home template
│   │   └── ...              # Other EJS templates
│   ├── public/
│   │   └── css/
│   │       └── styles.css   # Application styles
│   ├── app.js               # Main application file
│   └── db.js                # Database functions
├── data/
│   ├── app.db              # SQLite database
│   └── sessions.db         # Session storage
├── screenshots/            # Application screenshots
├── package.json           # Dependencies and scripts
├── README.md              # Project documentation
├── LICENSE                # MIT License
├── .env.example          # Environment variables template
├── railway.json          # Railway deployment config
└── render.yaml           # Render deployment config
```

## Key Files

- **src/app.js** - Main Express application setup
- **src/db.js** - Database schema and functions
- **src/routes/** - All route handlers organized by feature
- **src/views/** - EJS templates for the frontend
- **data/** - SQLite database files
- **package.json** - Project configuration and dependencies