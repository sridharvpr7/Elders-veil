const express = require('express');
const router = express.Router();
const WhatsAppWebhookController = require('../controllers/whatsappWebhookController');

// Meta WhatsApp Cloud API webhook verification and event receiver.
// These endpoints intentionally do not use JWT authentication because Meta calls them directly.
router.get('/whatsapp', WhatsAppWebhookController.verify);
router.post('/whatsapp', WhatsAppWebhookController.receive);

module.exports = router;
