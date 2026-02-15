import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Send daily progress email
export const sendDailyProgressEmail = async (user, progressData) => {
  try {
    if (!user.emailNotifications.enabled || !user.emailNotifications.dailyProgress) {
      return
    }

    const htmlContent = generateDailyProgressHTML(user, progressData)

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `📊 Your Daily Progress Report - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Daily progress email sent to ${user.email}`)

    // Update last email sent time
    user.emailNotifications.lastEmailSent = new Date()
    await user.save()
  } catch (error) {
    console.error("Error sending daily progress email:", error.message)
  }
}

// Send weekly report email
export const sendWeeklyReportEmail = async (user, weeklyData) => {
  try {
    if (!user.emailNotifications.enabled || !user.emailNotifications.weeklyReport) {
      return
    }

    const htmlContent = generateWeeklyReportHTML(user, weeklyData)

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `📈 Your Weekly Report - Week of ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Weekly report email sent to ${user.email}`)
  } catch (error) {
    console.error("Error sending weekly report email:", error.message)
  }
}

// Send contest reminder email
export const sendContestReminderEmail = async (user, contests) => {
  try {
    if (!user.emailNotifications.enabled || !user.emailNotifications.contestReminders) {
      return
    }

    const htmlContent = generateContestReminderHTML(user, contests)

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `🏆 Upcoming Contests - Don't Miss Out!`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Contest reminder email sent to ${user.email}`)
  } catch (error) {
    console.error("Error sending contest reminder email:", error.message)
  }
}

// Generate daily progress HTML
const generateDailyProgressHTML = (user, progressData) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Progress Report</h1>
          <p>${today}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name}! 👋</h2>
          <p>Here's your coding progress for today:</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Current Streak</div>
              <div class="stat-value">${user.streak.current} 🔥</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Longest Streak</div>
              <div class="stat-value">${user.streak.longest} ⭐</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Problems Solved</div>
              <div class="stat-value">${progressData.problemsSolved || 0}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Contests Joined</div>
              <div class="stat-value">${progressData.contestsJoined || 0}</div>
            </div>
          </div>

          <h3>Platform Stats:</h3>
          <ul>
            <li><strong>LeetCode:</strong> ${progressData.leetcode || 0} problems</li>
            <li><strong>CodeForces:</strong> ${progressData.codeforces || 0} problems</li>
            <li><strong>CodeChef:</strong> ${progressData.codechef || 0} problems</li>
            <li><strong>HackerRank:</strong> ${progressData.hackerrank || 0} problems</li>
          </ul>

          <p style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:5173/app/dashboard" class="button">View Full Dashboard</a>
          </p>
        </div>

        <div class="footer">
          <p>Keep up the great work! 💪</p>
          <p>You can manage email preferences in your settings.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate weekly report HTML
const generateWeeklyReportHTML = (user, weeklyData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Weekly Report</h1>
          <p>Your coding achievements this week</p>
        </div>
        
        <div class="content">
          <h2>Great work, ${user.name}! 🎉</h2>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total Problems</div>
              <div class="stat-value">${weeklyData.totalProblems || 0}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Contests</div>
              <div class="stat-value">${weeklyData.totalContests || 0}</div>
            </div>
          </div>

          <h3>Platform Breakdown:</h3>
          <ul>
            <li><strong>LeetCode:</strong> ${weeklyData.leetcode || 0} problems</li>
            <li><strong>CodeForces:</strong> ${weeklyData.codeforces || 0} problems</li>
            <li><strong>CodeChef:</strong> ${weeklyData.codechef || 0} problems</li>
            <li><strong>HackerRank:</strong> ${weeklyData.hackerrank || 0} problems</li>
          </ul>

          <p style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:5173/app/dashboard" class="button">View Progress Chart</a>
          </p>
        </div>

        <div class="footer">
          <p>Keep pushing your limits! 🚀</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate contest reminder HTML
const generateContestReminderHTML = (user, contests) => {
  const contestsList = contests
    .slice(0, 5)
    .map(
      (c) =>
        `<li><strong>${c.title}</strong> (${c.platform}) - ${new Date(c.startTime).toLocaleString()}</li>`
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Upcoming Contests</h1>
          <p>Don't miss these exciting competitions!</p>
        </div>
        
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p>Here are the upcoming contests you might want to participate in:</p>
          
          <ul>
            ${contestsList}
          </ul>

          <p style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:5173/app/dashboard" class="button">View All Contests</a>
          </p>
        </div>

        <div class="footer">
          <p>Good luck! 🍀</p>
        </div>
      </div>
    </body>
    </html>
  `
}
