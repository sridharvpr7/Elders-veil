const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const env = require('../config/env');

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

class WhatsAppWebhookController {
  static verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token && token === env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(String(challenge || ''));
    }

    return res.sendStatus(403);
  }

  static receive(req, res) {
    // Meta expects a fast 200 response. Process the notification after acknowledging it.
    res.sendStatus(200);

    WhatsAppWebhookController.process(req.body).catch((error) => {
      console.error('[WhatsApp Webhook] Processing error:', error.message);
    });
  }

  static async process(payload) {
    if (!payload || payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value || {};
        for (const status of value.statuses || []) {
          console.log(`[WhatsApp] Message ${status.id || 'unknown'} status: ${status.status || 'unknown'}`);
        }

        for (const message of value.messages || []) {
          const from = normalizePhone(message.from);
          if (!from) continue;

          const contactName = value.contacts?.find((contact) => contact.wa_id === message.from)?.profile?.name || 'WhatsApp user';
          const text = message.text?.body || `[${message.type || 'message'} message received]`;

          console.log(`[WhatsApp] Incoming ${message.type || 'message'} from ${from}: ${text.slice(0, 200)}`);

          const user = await User.findByPhone(from);
          if (user) {
            await NotificationService.create(
              user.id,
              'whatsapp_message',
              'WhatsApp message received',
              `${contactName}: ${text}`,
              { whatsappMessageId: message.id || null, from }
            );
          }

          if (env.WHATSAPP_AUTO_REPLY_ENABLED && message.type === 'text') {
            await NotificationService.whatsappText(
              from,
              `Hi ${contactName}! 👋 We received your message on Elder's Veil. Our team will get back to you soon.`
            );
          }
        }
      }
    }
  }
}

module.exports = WhatsAppWebhookController;
