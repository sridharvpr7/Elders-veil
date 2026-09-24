static async whatsapp(user, template, params={}) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      sent: false,
      reason: 'WhatsApp provider is not configured.'
    };
  }

  let phone = String(user.phone || '').replace(/\D/g, '');

  // Indian 10-digit number → 91XXXXXXXXXX
  if (/^[6-9]\d{9}$/.test(phone)) {
    phone = `91${phone}`;
  }

  if (!phone) {
    return {
      sent: false,
      reason: 'No mobile number available.'
    };
  }

  const url =
    `https://graph.facebook.com/${env.WHATSAPP_API_VERSION || 'v20.0'}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const components = [
    {
      type: 'body',
      parameters: Object.values(params).map(v => ({
        type: 'text',
        text: String(v)
      }))
    }
  ];

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: template,
      language: {
        code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
      },
      components
    }
  };

  console.log('[WhatsApp] Sending message:', {
    to: phone,
    template,
    params
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[WhatsApp] Meta API error:', {
        status: response.status,
        statusText: response.statusText,
        body
      });

      return {
        sent: false,
        status: response.status,
        body,
        reason: body?.error?.message || 'WhatsApp API request failed.'
      };
    }

    console.log('[WhatsApp] Message sent successfully:', {
      status: response.status,
      messageId: body?.messages?.[0]?.id
    });

    return {
      sent: true,
      status: response.status,
      providerMessageId: body?.messages?.[0]?.id,
      body
    };

  } catch (error) {
    console.error('[WhatsApp] Request failed:', {
      message: error.message,
      stack: error.stack
    });

    return {
      sent: false,
      reason: error.message
    };
  }
}
