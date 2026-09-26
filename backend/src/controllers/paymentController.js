const crypto = require('crypto');
const env = require('../config/env');
const db = require('../config/database');
const User = require('../models/User');
const Feature = require('../services/featureService');
const EmailService = require('../services/emailService');

class PaymentController {
  static async createOrder(req, res, next) {
    try {
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Premium online payment is not configured on this server.' });
      }
      const amount = Math.max(1, Number(env.PREMIUM_PRICE_INR) || 199) * 100;
      const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const receipt = `ev_${Date.now()}`;
      const r = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', receipt, notes: { userId: req.user.id, plan: 'premium_monthly' } })
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error?.description || 'Could not create payment order.');
      const id = Feature.id('pay');
      if (db.isPgConnected()) {
        await db.query(
          'INSERT INTO premium_payments(id,user_id,provider,order_id,amount_paise,status,raw) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [id, req.user.id, 'razorpay', b.id, amount, 'created', JSON.stringify(b)]
        );
      } else {
        db.fallbackStore.premium_payments ??= [];
        db.fallbackStore.premium_payments.push({
          id,
          user_id: req.user.id,
          provider: 'razorpay',
          order_id: b.id,
          amount_paise: amount,
          status: 'created',
          raw: b,
          created_at: new Date()
        });
        db.saveFallbackStore();
      }
      res.json({ keyId: env.RAZORPAY_KEY_ID, order: b, amount, currency: 'INR' });
    } catch (e) {
      next(e);
    }
  }

  static async verify(req, res, next) {
    try {
      if (!env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: 'Payment verification is not configured.' });
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== razorpay_signature) {
        if (req.user && req.user.email) {
          EmailService.sendPaymentFailedEmail(req.user.email, 'Premium VIP Monthly', '2.49', 'Invalid payment signature', 'premium_monthly').catch(() => {});
        }
        return res.status(400).json({ error: 'Invalid payment signature.' });
      }

      if (db.isPgConnected()) {
        await db.query('UPDATE premium_payments SET payment_id=$1,status=$2,paid_at=CURRENT_TIMESTAMP WHERE order_id=$3', [
          razorpay_payment_id,
          'paid',
          razorpay_order_id
        ]);
      } else {
        const p = (db.fallbackStore.premium_payments || []).find(x => x.order_id === razorpay_order_id);
        if (p) {
          p.payment_id = razorpay_payment_id;
          p.status = 'paid';
          p.paid_at = new Date();
          db.saveFallbackStore();
        }
      }

      const user = await User.setPremium(req.user.id, true, 1);
      await Feature.audit({
        actorId: req.user.id,
        action: 'premium_payment_verified',
        targetType: 'user',
        targetId: req.user.id,
        metadata: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
        ip: req.ip
      });

      if (user && user.email) {
        EmailService.sendPaymentSuccessEmail(user.email, 'Premium VIP Monthly', '2.49', razorpay_payment_id).catch(() => {});
      }

      res.json({ message: 'Premium activated for 1 month.', user });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = PaymentController;
