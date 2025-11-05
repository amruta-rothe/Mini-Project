# 📖 AttendanceMS User Guide

## 🚀 Getting Started

### First Login
1. Open the application in your browser
2. Use these credentials:
   - **Email**: `mjsfutane21@gmail.com`
   - **Password**: `abc@1234`
3. You'll see the main dashboard

### Change Your Password
1. Click on your name in the top-right corner
2. Select "Profile"
3. Update your password and profile information

## 📚 Managing Classes

### Create a New Class
1. Click "Create Class" in the sidebar
2. Enter class name (e.g., "Grade 5A")
3. Add section if needed (e.g., "A", "B")
4. Click "Save"

### Add Students to a Class
1. Go to a class from the dashboard
2. Click "Add Student"
3. Fill in student information:
   - Name
   - Roll Number
   - Parent Name
   - Parent Email (important for reports!)
   - Parent Phone
4. Click "Save"

### Import Students from CSV
1. Go to any class
2. Click "Import CSV"
3. Download the sample CSV template
4. Fill in your student data
5. Upload the file

## 📅 Daily Attendance

### Mark Attendance for a Class
1. Go to "Daily Attendance" from the sidebar
2. Click "Mark Attendance" for any class
3. Use the visual cards for each student:
   - **Green (Present)**: Student is present
   - **Red (Absent)**: Student is absent
   - **Yellow (Late)**: Student arrived late
   - **Blue (Excused)**: Excused absence
4. Add notes if needed
5. Click "Save Attendance"

### Quick Actions
- **Mark All Present**: Quickly mark entire class as present
- **Clear All**: Reset all selections
- **Search Students**: Find specific students quickly

## 📧 Weekly Email Reports

### Setup Email Configuration
1. Edit the `.env` file in your project
2. Add your email settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM="Your School <no-reply@school.com>"
   ```

### Send Weekly Reports
1. Go to "Weekly Reports" from the sidebar
2. Click "Send Weekly Report" for individual classes
3. Or click "Send All Reports" for all classes
4. Parents will receive beautiful HTML emails with:
   - Weekly attendance summary
   - Daily breakdown with icons
   - Attendance percentage
   - Alerts for low attendance

### Email Report Contents
Parents receive emails with:
- 📊 **Weekly Statistics**: Present/Absent/Late/Excused counts
- 📈 **Attendance Percentage**: Visual percentage with color coding
- 📅 **Daily Breakdown**: Day-by-day attendance with icons
- ⚠️ **Alerts**: Warnings for low attendance or congratulations for perfect attendance
- 🎨 **Professional Design**: School-branded HTML template

## 📊 Reports and Analytics

### Dashboard Analytics
- **Real-time Statistics**: Current attendance numbers
- **Charts**: Visual representation of attendance trends
- **Quick Actions**: Fast access to common tasks
- **Class Overview**: Summary of all your classes

### Generate Reports
1. Go to "Reports" from the sidebar
2. Select date range
3. Choose class or all classes
4. Select report type:
   - Daily Summary
   - Weekly Summary
   - Monthly Report
   - Student-wise Report
5. Export as PDF or Excel

## 🎯 Tips for Best Results

### For Teachers
- ✅ **Mark attendance daily** for accurate records
- ✅ **Add parent emails** to enable automated reports
- ✅ **Use notes** to record important information
- ✅ **Check dashboard regularly** for insights

### For Parents
- 📧 **Check email weekly** for attendance reports
- 📱 **Save school contact** for quick communication
- 📊 **Monitor attendance trends** in the reports
- 🚨 **Respond to absence alerts** promptly

### For Administrators
- 🏫 **Train teachers** on the system
- ⚙️ **Configure email settings** properly
- 📋 **Monitor system usage** through reports
- 🔄 **Regular backups** of attendance data

## 🆘 Troubleshooting

### Common Issues

**Can't Login?**
- Check your email and password
- Ensure caps lock is off
- Contact administrator for password reset

**Email Reports Not Sending?**
- Check `.env` file configuration
- Verify email credentials
- Test with a single class first

**Students Not Showing?**
- Ensure students are added to the correct class
- Check if class is selected properly
- Refresh the page

**Mobile Issues?**
- Use latest browser version
- Clear browser cache
- Ensure stable internet connection

### Getting Help
- 📧 **Email Support**: Contact your system administrator
- 📖 **Documentation**: Check this user guide
- 🐛 **Report Issues**: Use the GitHub issues page
- 💬 **Community**: Ask questions in discussions

## 🔒 Security Best Practices

- 🔐 **Change default password** immediately
- 🚫 **Don't share login credentials**
- 📱 **Logout when done** on shared devices
- 🔄 **Regular password updates**
- 📧 **Verify email settings** are secure

## 📱 Mobile Usage Tips

- 📲 **Add to Home Screen** for quick access
- 🔄 **Rotate screen** for better view on tablets
- 👆 **Use touch gestures** for navigation
- 📶 **Ensure good internet** for smooth operation

---

**Need more help?** Contact your system administrator or check the project documentation on GitHub.