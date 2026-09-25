static async whatsapp(user, template, params = {}) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error('[WhatsApp] Missing access token or phone number ID.');
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
    console.error('[WhatsApp] No mobile number available.');
    return {
      sent: false,
      reason: 'No mobile number available.'
    };
  }

  const apiVersion = env.WHATSAPP_API_VERSION || 'v20.0';

  const url =
    `https://graph.facebook.com/${apiVersion}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const parameters = Object.values(params).map(value => ({
    type: 'text',
    text: String(value)
  }));

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: template,
      language: {
        code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
      },
      components: [
        {
          type: 'body',
          parameters
        }
      ]
    }
  };

  console.log('[WhatsApp] Sending message:', {
    to: phone,
    template,
    language: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
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

    const responseText = await response.text();

    let body = {};

    try {
      body = responseText ? JSON.parse(responseText) : {};
    } catch {
      body = {
        raw: responseText
      };
    }

    // 🔴 META ERROR
    if (!response.ok) {
      console.error('[WhatsApp] Meta API error:', {
        status: response.status,
        statusText: response.statusText,
        errorCode: body?.error?.code,
        errorType: body?.error?.type,
        errorMessage: body?.error?.message,
        errorData: body?.error?.error_data,
        fbtraceId: body?.error?.fbtrace_id,
        fullBody: body
      });

      return {
        sent: false,
        status: response.status,
        body,
        reason:
          body?.error?.message ||
          'WhatsApp API request failed.'
      };
    }

    // 🟢 SUCCESS
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
module.exports=NotificationService;