# 📚 AttendanceMS - Ready to Use!

A modern, user-friendly attendance management system for schools and educational institutions. Built with Node.js, this system allows teachers to efficiently track student attendance and automatically send weekly reports to parents.

## 🌟 Key Features

### 👨‍🏫 For Teachers
- **📅 Daily Attendance Tracking** - Visual, intuitive interface for marking attendance
- **📊 Real-time Analytics** - Dashboard with charts and statistics
- **📧 Automated Email Reports** - Weekly attendance reports sent to parents
- **👥 Student Management** - Easy student and class management
- **📱 Mobile Friendly** - Works perfectly on phones and tablets

### 👨‍👩‍👧‍👦 For Parents
- **📬 Weekly Email Reports** - Detailed attendance summaries with charts
- **🚨 Instant Notifications** - Immediate alerts for absences
- **📈 Progress Tracking** - Visual attendance trends and statistics

### 🎯 For Administrators
- **🏫 Multi-Class Support** - Manage multiple classes and teachers
- **📋 Comprehensive Reports** - Generate detailed attendance analytics
- **⚙️ Easy Configuration** - Simple setup and customization

## 🚀 Quick Start (2 Minutes!)

### Option 1: One-Command Setup
```bash
git clone https://github.com/Mayuri2428/Mini-Project.git
cd Mini-Project
npm run setup
npm start
```

### Option 2: Manual Setup
```bash
# 1. Clone the repository
git clone https://github.com/Mayuri2428/Mini-Project.git
cd Mini-Project

# 2. Install dependencies
npm install

# 3. Setup database
npm run db:init
npm run db:seed

# 4. Start the application
npm start
```

### 🌐 Instant Online Access
**No installation needed!** Use GitHub Codespaces:
1. Go to: https://github.com/Mayuri2428/Mini-Project
2. Click "Code" → "Codespaces" → "Create codespace"
3. Wait for setup (2-3 minutes)
4. Run: `npm start`
5. Access your app instantly!

## 🔑 Default Login
- **Email**: `mjsfutane21@gmail.com`
- **Password**: `abc@1234`

## 📧 Email Configuration (Optional)

To send weekly reports to parents, edit the `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Your School <no-reply@yourschool.com>"
```

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate an "App Password" 
3. Use the app password in `SMTP_PASS`

## 🌐 Share with Others - Deployment Options

### 🚀 Free Cloud Deployment (Recommended)

#### Railway (Easiest)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Deploy from: `https://github.com/Mayuri2428/Mini-Project`
4. Your app will be live at: `https://your-app.railway.app`

#### Render
1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Auto-deploys with included `render.yaml`
4. Free tier available

#### Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Instant deployment

### 📱 Mobile Access
The app is fully responsive and works perfectly on:
- 📱 Smartphones (iOS/Android)
- 📟 Tablets
- 💻 Laptops/Desktops

## 🎯 How to Use

### 1. **First Time Setup**
- Login with default credentials
- Create your classes
- Add students with parent email addresses
- Configure email settings (optional)

### 2. **Daily Usage**
- Go to "Daily Attendance"
- Select a class
- Mark attendance with visual cards
- Save attendance

### 3. **Weekly Reports**
- Go to "Weekly Reports"
- Click "Send Weekly Report" for any class
- Parents receive beautiful HTML emails

### 4. **View Analytics**
- Dashboard shows real-time statistics
- Charts and graphs for insights
- Export reports as needed

## 🛠️ System Requirements

- **Node.js**: Version 18 or higher
- **Browser**: Chrome, Firefox, Safari, Edge
- **Storage**: 50MB for database
- **Memory**: 512MB RAM minimum

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

## 🎯 Ready to Share!

Your AttendanceMS is now production-ready! Here's how to share it:

### 🌐 **Instant Sharing Options**

1. **GitHub Codespaces** (Immediate Access)
   - Share this link: https://github.com/Mayuri2428/Mini-Project
   - Others click "Code" → "Codespaces" → "Create codespace"
   - No installation needed!

2. **One-Click Deployment**
   - Railway: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Mayuri2428/Mini-Project)
   - Render: [Deploy to Render](https://render.com/deploy?repo=https://github.com/Mayuri2428/Mini-Project)

3. **Local Installation**
   ```bash
   git clone https://github.com/Mayuri2428/Mini-Project.git
   cd Mini-Project
   npm run setup
   npm start
   ```

### 📚 **Documentation**
- 📖 **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- 🚀 **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- ⚙️ **Setup Instructions**: Run `npm run setup`

### 🆘 **Support**
- **Issues**: [GitHub Issues](https://github.com/Mayuri2428/Mini-Project/issues)
- **Email**: mjsfutane21@gmail.com
- **Documentation**: Check the guides above

---

**🎉 Your AttendanceMS is ready to use and share with the world!**
