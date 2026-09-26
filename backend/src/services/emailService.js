const nodemailer = require('nodemailer');
const env = require('../config/env');
const templates = require('../config/email-templates.json');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function render(template, values = {}) {
  let output = String(template || '');
  for (const [key, value] of Object.entries(values)) {
    output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
  }
  return output;
}

class EmailService {
  static getTransporter() {
    if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD) return null;
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      pool: true,
      maxConnections: 3,
      maxMessages: 50
    });
  }

  static buildHtml(title, content) {
    return `<!doctype html><html><body style="margin:0;background:#0b0714;color:#f5f3ff;font-family:Arial,sans-serif;padding:24px"><div style="max-width:620px;margin:auto;background:#171022;border:1px solid #35245a;border-radius:16px;padding:32px"><div style="font-size:13px;color:#a78bfa;font-weight:700;letter-spacing:1px">ELDER'S VEIL</div><h1 style="font-size:26px;margin:16px 0;color:#fff">${escapeHtml(title)}</h1><div style="font-size:15px;line-height:1.7;color:#ddd6fe">${content}</div><hr style="border:0;border-top:1px solid #35245a;margin:28px 0"><div style="font-size:12px;color:#9ca3af">This is an automated email from Elder's Veil. Please do not reply if you did not expect this message.</div></div></body></html>`;
  }

  static async send({ to, subject, text, html }) {
    if (!to) throw new Error('Recipient email is required.');
    const transporter = this.getTransporter();
    if (!transporter) throw new Error('SMTP email is not configured. Set EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD.');
    const info = await transporter.sendMail({
      from: { address: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
      to,
      subject,
      text,
      html
    });
    return { sent: true, messageId: info.messageId, provider: 'smtp' };
  }

  static async sendTemplate(key, { to, values = {}, text = '' }) {
    const tpl = templates[key];
    if (!tpl) throw new Error(`Email template not found: ${key}`);
    const subject = render(tpl.subject, values);
    const title = render(tpl.title, values);
    const content = render(tpl.content, values);
    return this.send({
      to,
      subject,
      text: text || subject,
      html: this.buildHtml(title, content)
    });
  }

  static sendOTPEmail(user, otp) { return this.sendTemplate('otp', { to: user.email, values: { username: user.username, otp } }); }
  static sendWelcomeEmail(user) { return this.sendTemplate('welcome', { to: user.email, values: { username: user.username } }); }
  static sendForgotPasswordOTPEmail(user, otp) { return this.sendTemplate('resetOtp', { to: user.email, values: { username: user.username, otp } }); }
  static sendComicApprovedEmail(user, comic) { return this.sendTemplate('comicApproved', { to: user.email, values: { username: user.username, comicTitle: comic.title } }); }
  static sendComicRejectedEmail(user, comic, reason) { return this.sendTemplate('comicRejected', { to: user.email, values: { username: user.username, comicTitle: comic.title, reason: reason || 'No additional note was provided.' } }); }
  static sendChapterApprovedEmail(user, comic, chapter) { return this.sendTemplate('chapterApproved', { to: user.email, values: { username: user.username, comicTitle: comic.title, chapterNumber: chapter.chapterNumber } }); }
  static sendChapterRejectedEmail(user, comic, chapter, reason) { return this.sendTemplate('chapterRejected', { to: user.email, values: { username: user.username, comicTitle: comic.title, chapterNumber: chapter.chapterNumber, reason: reason || 'No additional note was provided.' } }); }
  static sendNewComicEmail(user, comic) { return this.sendTemplate('newComic', { to: user.email, values: { username: user.username, comicTitle: comic.title, url: `${env.FRONTEND_URL || ''}/comic.html?slug=${comic.slug}` } }); }
  static sendNewChapterEmail(user, comic, chapter) { return this.sendTemplate('newChapter', { to: user.email, values: { username: user.username, comicTitle: comic.title, chapterNumber: chapter.chapterNumber, url: `${env.FRONTEND_URL || ''}/reader.html?id=${chapter.id}` } }); }
  static sendPremiumActivatedEmail(user, expiresAt) { return this.sendTemplate('premiumActivated', { to: user.email, values: { username: user.username, expiresAt: new Date(expiresAt).toLocaleDateString('en-IN') } }); }
  static sendPaymentSuccessEmail(user, amount, expiresAt) { return this.sendTemplate('paymentSuccess', { to: user.email, values: { username: user.username, amount, expiresAt: new Date(expiresAt).toLocaleDateString('en-IN') } }); }
  static sendPaymentFailedEmail(user, amount) { return this.sendTemplate('paymentFailed', { to: user.email, values: { username: user.username, amountText: amount ? ` of ${amount}` : '' } }); }
  static sendAdminAnnouncementEmail(user, message) { return this.sendTemplate('adminAnnouncement', { to: user.email, values: { username: user.username, message } }); }
  static sendAdminPromotedEmail(user) { return this.sendTemplate('adminPromoted', { to: user.email, values: { username: user.username } }); }
  static sendAdminRemovedEmail(user) { return this.sendTemplate('adminRemoved', { to: user.email, values: { username: user.username } }); }
  static sendAccountDeletedEmail(user) { return this.sendTemplate('accountDeleted', { to: user.email, values: { username: user.username } }); }
}

module.exports = EmailService;
