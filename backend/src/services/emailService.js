const nodemailer = require('nodemailer');
const env = require('../config/env');
const templatesConfig = require('../config/email-templates.json');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderTemplate(templateString, values = {}) {
  let output = String(templateString || '');
  for (const [key, value] of Object.entries(values)) {
    output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return output;
}

class EmailService {
  static getTransporter() {
    if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD) return null;
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT || 587,
      secure: env.EMAIL_SECURE || false,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
      connectionTimeout: 10000,
      socketTimeout: 15000
    });
  }

  static renderMasterHTML({ title, badge, preheader, contentHtml, buttonText, buttonUrl }) {
    const appName = templatesConfig.appName || "Elder's Veil";
    const appUrl = env.FRONTEND_URL || templatesConfig.appUrl || 'http://localhost:5000';
    const fullButtonUrl = buttonUrl ? (buttonUrl.startsWith('http') ? buttonUrl : `${appUrl}${buttonUrl}`) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || appName)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #0b0f19; padding: 40px 15px; box-sizing: border-box; }
    .container { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #31104b 100%); padding: 30px; text-align: center; border-bottom: 1px solid #2e1065; }
    .brand-logo { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #a855f7; text-transform: uppercase; text-decoration: none; }
    .badge { display: inline-block; margin-top: 10px; padding: 4px 12px; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.4); color: #c084fc; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 35px 30px; line-height: 1.6; color: #cbd5e1; }
    .content h1 { color: #ffffff; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff !important; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(139,92,246,0.4); }
    .footer { background-color: #0b0f19; padding: 25px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader || '')}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-logo">📖 Elder's Veil</div>
        ${badge ? `<div class="badge">${escapeHtml(badge)}</div>` : ''}
      </div>
      <div class="content">
        ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
        ${contentHtml}
        ${buttonText && fullButtonUrl ? `<div class="button-container"><a href="${fullButtonUrl}" class="btn" target="_blank">${escapeHtml(buttonText)}</a></div>` : ''}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${templatesConfig.companyName || "Elder's Veil"}. All rights reserved.</p>
        <p>You received this automated notification regarding your account at <a href="${appUrl}">${appUrl}</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  static async send({ to, subject, text, html }) {
    if (!to) {
      return { sent: false, reason: 'Recipient email address is required.' };
    }

    const fromAddress = env.EMAIL_FROM || 'noreply@eldersveil.com';
    const fromName = env.EMAIL_FROM_NAME || "Elder's Veil";
    const formattedFrom = `"${fromName}" <${fromAddress}>`;

    const bodyHtml = html || `<p>${String(text || '').replace(/\n/g, '<br>')}</p>`;

    const transporter = EmailService.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: formattedFrom,
          to,
          subject,
          text: text || '',
          html: bodyHtml
        });
        console.log(`[EmailService] SMTP email sent to ${to}: ${info.messageId}`);
        return { sent: true, id: info.messageId, provider: 'smtp' };
      } catch (err) {
        console.error(`[EmailService] SMTP error: ${err.message}`);
      }
    }

    console.log(`[EmailService - DEV FALLBACK] To: ${to} | Subject: "${subject}"`);
    return { sent: true, id: 'dev-fallback-id', provider: 'console-fallback' };
  }

  static async sendTemplate(key, { to, values = {}, customText = '' }) {
    const tpl = templatesConfig.templates[key];
    if (!tpl) throw new Error(`Email template not found: ${key}`);

    const subject = renderTemplate(tpl.subject, values);
    const title = renderTemplate(tpl.title, values);
    const preheader = renderTemplate(tpl.preheader || '', values);
    const contentHtml = renderTemplate(tpl.content, values);
    const buttonText = renderTemplate(tpl.buttonText || '', values);
    const buttonUrl = renderTemplate(tpl.actionPath || '', values);

    const html = EmailService.renderMasterHTML({
      title,
      badge: tpl.badge,
      preheader,
      contentHtml,
      buttonText,
      buttonUrl
    });

    return EmailService.send({
      to,
      subject,
      text: customText || subject,
      html
    });
  }

  // 1. Email Verification OTP
  static sendOTPEmail(user, otp) {
    return this.sendTemplate('otp', { to: user.email, values: { username: user.username, otp } });
  }

  // 2. Welcome Email
  static sendWelcomeEmail(user) {
    return this.sendTemplate('welcome', { to: user.email, values: { username: user.username } });
  }

  // 3. Forgot Password OTP
  static sendForgotPasswordOTPEmail(user, otp) {
    return this.sendTemplate('resetOtp', { to: user.email, values: { username: user.username, otp } });
  }

  // 4. Premium Request Received
  static sendPremiumRequestedEmail(user) {
    return this.sendTemplate('premiumRequested', { to: user.email, values: { username: user.username } });
  }

  // 5. Premium Activated
  static sendPremiumActivatedEmail(user, expiresAt) {
    const expiryText = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Lifetime Access';
    return this.sendTemplate('premiumActivated', { to: user.email, values: { username: user.username, expiresAt: expiryText } });
  }

  // 6. Premium Request Rejected
  static sendPremiumRejectedEmail(user, reason = 'Did not meet requirements') {
    return this.sendTemplate('premiumRejected', { to: user.email, values: { username: user.username, reason } });
  }

  // 7. Comic Approved
  static sendComicApprovedEmail(user, comic) {
    return this.sendTemplate('comicApproved', { to: user.email, values: { username: user.username, comicTitle: comic.title, comicId: comic.id } });
  }

  // 8. Comic Rejected
  static sendComicRejectedEmail(user, comic, reason) {
    return this.sendTemplate('comicRejected', { to: user.email, values: { username: user.username, comicTitle: comic.title, reason: reason || 'Review feedback' } });
  }

  // 9. New Comic Broadcast
  static sendNewComicEmail(user, comic) {
    const url = `/comic-detail.html?id=${comic.id}`;
    return this.sendTemplate('newComic', { to: user.email, values: { username: user.username, comicTitle: comic.title, url } });
  }

  // 10. New Chapter Broadcast
  static sendNewChapterEmail(user, comic, chapter) {
    const chNum = chapter.chapterNumber || chapter.chapter_number || 1;
    const url = `/reader.html?id=${chapter.id}`;
    return this.sendTemplate('newChapter', { to: user.email, values: { username: user.username, comicTitle: comic.title, chapterNumber: chNum, url } });
  }

  // 11. Payment Success
  static sendPaymentSuccessEmail(user, amount, transactionId) {
    return this.sendTemplate('paymentSuccess', { to: user.email, values: { username: user.username, amount, transactionId: transactionId || 'N/A' } });
  }

  // 12. Payment Failed
  static sendPaymentFailedEmail(user, amount, reason) {
    return this.sendTemplate('paymentFailed', { to: user.email, values: { username: user.username, amount, reason: reason || 'Transaction declined' } });
  }

  // 13. Admin Announcement
  static sendAdminAnnouncementEmail(user, subject, title, message) {
    return this.sendTemplate('adminAnnouncement', { to: user.email, values: { username: user.username, message } });
  }

  // 14. Account Security Notice
  static sendSecurityNoticeEmail(user, message) {
    return this.sendTemplate('securityNotice', { to: user.email, values: { username: user.username, message } });
  }
}

module.exports = EmailService;
