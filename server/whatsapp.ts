import { BusinessSettings, Order, WhatsAppNotificationRecord } from '../src/types';
import {
  buildOrderWhatsAppUrl,
  formatOrderWhatsAppMessage,
  normalizeDigitsPhone,
} from '../src/utils/commerce';

export interface WhatsAppIntegrationStatus {
  configured: boolean;
  provider: 'meta_cloud_api' | 'webhook_provider' | 'manual_wa_link';
  recipientPhone: string;
  description: string;
}

export function getWhatsAppIntegrationStatus(defaultRecipient = '+923334934403'): WhatsAppIntegrationStatus {
  const recipient = (process.env.WHATSAPP_RECIPIENT_NUMBER || defaultRecipient || '+923334934403').trim();
  const hasMetaCloud =
    Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim()) &&
    Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  const hasWebhook = Boolean(process.env.WHATSAPP_WEBHOOK_URL?.trim());

  if (hasMetaCloud) {
    return {
      configured: true,
      provider: 'meta_cloud_api',
      recipientPhone: recipient,
      description: `Official Meta WhatsApp Cloud API active -> dispatching automatic order alerts to ${recipient}.`,
    };
  }

  if (hasWebhook) {
    return {
      configured: true,
      provider: 'webhook_provider',
      recipientPhone: recipient,
      description: `Compatible WhatsApp Webhook provider active -> dispatching automatic order alerts to ${recipient}.`,
    };
  }

  return {
    configured: false,
    provider: 'manual_wa_link',
    recipientPhone: recipient,
    description: `WhatsApp Business API env vars not set — prefilled WhatsApp notification button (${recipient}) enabled on Order Confirmation and Admin Dashboard.`,
  };
}

export async function sendWhatsAppOrderNotification(
  order: Order,
  settings: BusinessSettings
): Promise<WhatsAppNotificationRecord> {
  const recipientRaw = (
    process.env.WHATSAPP_RECIPIENT_NUMBER ||
    settings.whatsappIntl ||
    '+923334934403'
  ).trim();
  const recipientDigits = normalizeDigitsPhone(recipientRaw) || '923334934403';
  const recipientDisplay = recipientRaw.startsWith('+') ? recipientRaw : `+${recipientDigits}`;
  const attemptedAt = new Date().toISOString();
  const messageBody = formatOrderWhatsAppMessage(order, settings);
  const prefilledUrl = buildOrderWhatsAppUrl(recipientDisplay, order, settings);

  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL?.trim();
  const webhookAuth = process.env.WHATSAPP_WEBHOOK_AUTH_TOKEN?.trim();

  // 1. Official Meta WhatsApp Business Cloud API
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(metaPhoneId)}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientDigits,
            type: 'text',
            text: {
              preview_url: false,
              body: messageBody,
            },
          }),
        }
      );

      if (response.ok) {
        return {
          configured: true,
          deliveredAutomatically: true,
          provider: 'meta_cloud_api',
          recipientPhone: recipientDisplay,
          attemptedAt,
          prefilledUrl,
          statusMessage: `Order notification automatically sent to ${recipientDisplay} via WhatsApp Business Cloud API.`,
        };
      }

      return {
        configured: true,
        deliveredAutomatically: false,
        provider: 'meta_cloud_api',
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `WhatsApp Cloud API returned HTTP ${response.status}. Use the prefilled WhatsApp button below to send your order details directly to ${recipientDisplay}.`,
      };
    } catch {
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: 'meta_cloud_api',
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `Automatic WhatsApp dispatch could not reach Cloud API. Use the prefilled WhatsApp button below to notify ${recipientDisplay}.`,
      };
    }
  }

  // 2. Compatible WhatsApp Webhook Provider (e.g., Twilio / WATI / Ultramsg / Custom Bridge)
  if (webhookUrl) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (webhookAuth) {
        headers.Authorization = `Bearer ${webhookAuth}`;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: recipientDisplay,
          toDigits: recipientDigits,
          message: messageBody,
          orderReference: order.reference,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          transactionReference: order.paymentDetails?.transactionId || '',
          totalAmountPkr: order.grandTotalPkr ?? order.subtotalPkr,
          customer: {
            name: order.contact.fullName,
            phone: order.contact.phone,
          },
        }),
      });

      if (response.ok) {
        return {
          configured: true,
          deliveredAutomatically: true,
          provider: 'webhook_provider',
          recipientPhone: recipientDisplay,
          attemptedAt,
          prefilledUrl,
          statusMessage: `Order notification automatically dispatched to ${recipientDisplay} via WhatsApp provider.`,
        };
      }

      return {
        configured: true,
        deliveredAutomatically: false,
        provider: 'webhook_provider',
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `WhatsApp provider returned HTTP ${response.status}. Use the prefilled WhatsApp button below to send order details to ${recipientDisplay}.`,
      };
    } catch {
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: 'webhook_provider',
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `Could not reach WhatsApp webhook provider. Use the prefilled WhatsApp button below to send order details to ${recipientDisplay}.`,
      };
    }
  }

  // 3. Fallback: Prefilled WhatsApp Message Link to +923334934403
  return {
    configured: false,
    deliveredAutomatically: false,
    provider: 'manual_wa_link',
    recipientPhone: recipientDisplay,
    attemptedAt,
    prefilledUrl,
    statusMessage: `Ready to send on WhatsApp (${recipientDisplay}) with your prefilled order summary.`,
  };
}
