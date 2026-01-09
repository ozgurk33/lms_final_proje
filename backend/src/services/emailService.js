import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter configuration
const createTransporter = () => {
    // Support both Gmail and generic SMTP
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD, // App password for Gmail
            },
        });
    }

    // Generic SMTP configuration
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Email templates
const templates = {
    enrollment: (data) => ({
        subject: `Welcome to ${data.courseName}!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Course Enrollment Confirmation</h2>
        <p>Hi ${data.userName},</p>
        <p>You have been successfully enrolled in <strong>${data.courseName}</strong>.</p>
        <p>Course Description: ${data.courseDescription || 'N/A'}</p>
        <p>Instructor: ${data.instructorName || 'TBA'}</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/courses/${data.courseId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Course
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from your LMS platform.
        </p>
      </div>
    `,
    }),

    quizResult: (data) => ({
        subject: `Quiz Result: ${data.quizTitle}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${data.isPassed ? '#10B981' : '#EF4444'};">
          Quiz ${data.isPassed ? 'Passed' : 'Not Passed'}
        </h2>
        <p>Hi ${data.userName},</p>
        <p>Your quiz <strong>${data.quizTitle}</strong> has been graded.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Score:</strong> ${data.score}%</p>
          <p style="margin: 5px 0;"><strong>Passing Score:</strong> ${data.passingScore}%</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> 
            <span style="color: ${data.isPassed ? '#10B981' : '#EF4444'}; font-weight: bold;">
              ${data.isPassed ? 'PASSED ✓' : 'FAILED ✗'}
            </span>
          </p>
          ${data.attempt ? `<p style="margin: 5px 0;"><strong>Attempt:</strong> ${data.attempt}</p>` : ''}
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/quizzes/${data.quizId}/results" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Detailed Results
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from your LMS platform.
        </p>
      </div>
    `,
    }),

    courseUpdate: (data) => ({
        subject: `Update: ${data.courseName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Course Update Notification</h2>
        <p>Hi ${data.userName},</p>
        <p>There's a new update in <strong>${data.courseName}</strong>:</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; margin: 0;">${data.updateMessage}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/courses/${data.courseId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Course
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from your LMS platform.
        </p>
      </div>
    `,
    }),

    assignmentGraded: (data) => ({
        subject: `Assignment Graded: ${data.assignmentTitle}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Assignment Graded</h2>
        <p>Hi ${data.userName},</p>
        <p>Your assignment <strong>${data.assignmentTitle}</strong> has been graded.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Grade:</strong> ${data.grade}/${data.maxGrade}</p>
          ${data.feedback ? `<p style="margin: 5px 0;"><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/courses/${data.courseId}/assignments/${data.assignmentId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Assignment
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from your LMS platform.
        </p>
      </div>
    `,
    }),

    welcomeUser: (data) => ({
        subject: 'Welcome to LMS Platform!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to LMS!</h2>
        <p>Hi ${data.userName},</p>
        <p>Your account has been created successfully.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Username:</strong> ${data.username}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/login" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login Now
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from your LMS platform.
        </p>
      </div>
    `,
    }),
};

/**
 * Send email using specified template
 * @param {string} to - Recipient email address
 * @param {string} templateName - Name of the template to use
 * @param {object} data - Data to populate the template
 * @returns {Promise} - Nodemailer send result
 */
export const sendEmail = async (to, templateName, data) => {
    try {
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('Email not configured. Skipping email send.');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();
        const template = templates[templateName];

        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        const { subject, html } = template(data);

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'LMS Platform'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send multiple emails (batch)
 * @param {Array} emails - Array of {to, templateName, data}
 * @returns {Promise} - Results array
 */
export const sendBatchEmails = async (emails) => {
    const results = await Promise.allSettled(
        emails.map(({ to, templateName, data }) =>
            sendEmail(to, templateName, data)
        )
    );

    return results.map((result, index) => ({
        email: emails[index].to,
        status: result.status,
        value: result.value || result.reason,
    }));
};

/**
 * Test email configuration
 */
export const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('Email configuration is valid!');
        return { success: true };
    } catch (error) {
        console.error('Email configuration error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    sendEmail,
    sendBatchEmails,
    testEmailConfig,
};
