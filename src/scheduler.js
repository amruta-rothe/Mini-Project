import { all } from './db.js';
import nodemailer from 'nodemailer';

// This would typically run as a cron job or scheduled task
// For now, it's a manual function that can be called

export async function sendWeeklyReportsToAllClasses() {
  console.log('Starting weekly report generation...');
  
  try {
    // Get all classes
    const classes = await all(`SELECT id, name FROM classes`);
    
    let totalSent = 0;
    let totalErrors = 0;
    
    for (const cls of classes) {
      try {
        console.log(`Processing class: ${cls.name}`);
        
        // Generate reports for this class
        const result = await generateWeeklyReports(cls.id);
        totalSent += result.sent;
        totalErrors += result.errors;
        
        console.log(`Class ${cls.name}: ${result.sent} reports sent, ${result.errors} errors`);
        
      } catch (error) {
        console.error(`Error processing class ${cls.name}:`, error);
        totalErrors++;
      }
    }
    
    console.log(`Weekly report generation completed: ${totalSent} reports sent, ${totalErrors} errors`);
    
    return {
      success: true,
      totalSent,
      totalErrors,
      classesProcessed: classes.length
    };
    
  } catch (error) {
    console.error('Error in weekly report generation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to check if it's time to send weekly reports (e.g., every Friday)
export function shouldSendWeeklyReports() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
  const hour = now.getHours();
  
  // Send reports on Friday at 5 PM
  return dayOfWeek === 5 && hour === 17;
}

// Example usage in a cron job or scheduled task:
// if (shouldSendWeeklyReports()) {
//   sendWeeklyReportsToAllClasses();
// }

// For manual testing, you can call:
// sendWeeklyReportsToAllClasses().then(console.log).catch(console.error);