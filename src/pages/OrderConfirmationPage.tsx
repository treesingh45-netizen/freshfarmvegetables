import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileImage,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import {
  buildOrderWhatsAppUrl,
  formatOrderWhatsAppMessage,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  formatPkr,
} from '../utils/commerce';

const MAX_RECEIPT_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export function OrderConfirmationPage({ reference }: { reference: string }) {
  const { settings, authToken, currentSearch, navigate } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Optional follow-up payment proof submission (before verification)
  const [showProofForm, setShowProofForm] = useState(false);
  const [txnInput, setTxnInput] = useState('');
  const [senderInput, setSenderInput] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  const params = new URLSearchParams(currentSearch);
  const queryEmail = params.get('email') || '';
  const queryToken = params.get('token') || '';

  useEffect(() => {
    document.title = `Order ${reference} — Fresh Farm Vegetables`;

    const loadOrder = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers.Authorization = `Bearer ${authToken}`;
        const qs = new URLSearchParams();
        if (queryToken) qs.set('token', queryToken);
        if (queryEmail) qs.set('email', queryEmail);

        const res = await fetch(
          `/api/orders/${encodeURIComponent(reference)}?${qs.toString()}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not retrieve order.');
        setOrder(data.order);
        setTxnInput(data.order?.paymentDetails?.transactionId || '');
        setSenderInput(data.order?.paymentDetails?.senderInfo || '');
      } catch (err: any) {
        setError(err.message || 'Unable to load order details.');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [reference, queryEmail, queryToken, authToken]);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setProofError('Please upload a PNG, JPG, or WEBP receipt image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      setProofError('Receipt image must be 3 MB or smaller.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptDataUrl(reader.result);
        setReceiptFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setProofError('');
    setProofSuccess('');
    setSubmittingProof(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const qs = new URLSearchParams();
      if (queryToken) qs.set('token', queryToken);
      if (queryEmail) qs.set('email', queryEmail);

      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.reference)}/payment-proof?${qs.toString()}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transactionId: txnInput.trim(),
            senderInfo: senderInput.trim(),
            receiptDataUrl: receiptDataUrl || undefined,
            receiptFileName: receiptFileName || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update payment proof.');
      setOrder(data.order);
      setReceiptDataUrl('');
      setReceiptFileName('');
      setShowProofForm(false);
      setProofSuccess(
        'Payment proof received. Your order remains in Payment Verification Pending status until verified by our team.'
      );
    } catch (err: any) {
      setProofError(err.message || 'Unable to submit payment proof.');
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-[#5A6B5D]">
        Loading order &amp; payment confirmation...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-white rounded-3xl border border-[#DCE8DC] p-8 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#18261B]">Order Lookup</h1>
          <p className="text-sm text-[#5A6B5D]">{error || 'Order not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="h-10 px-5 rounded-2xl bg-[#12B326] text-white text-sm font-semibold"
          >
            Sign In to View Order History
          </button>
        </div>
      </div>
    );
  }

  const recipientWhatsApp = settings.whatsappIntl || '+923334934403';
  const waMessageText = formatOrderWhatsAppMessage(order, settings);
  const waOrderUrl =
    order.whatsappNotification?.prefilledUrl ||
    buildOrderWhatsAppUrl(recipientWhatsApp, order, settings);

  const isPaidVerified = order.paymentStatus === 'paid';
  const isPendingVerification = order.paymentStatus === 'pending_verification';
  const isRejected = order.paymentStatus === 'rejected';
  const orderTotalDisplayPkr = order.grandTotalPkr ?? order.subtotalPkr;

  const handleCopyWhatsAppMessage = async () => {
    try {
      await navigator.clipboard.writeText(waMessageText);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Main Confirmation Header & Payment Verification Banner */}
      <div className="bg-white rounded-3xl border border-[#DCE8DC] p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#12B326]/15 text-[#12B326] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F5338]">
                Order Confirmation
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#18261B] mt-0.5">
                Thank you, {order.contact.fullName}
              </h1>
              <p className="text-sm text-[#5A6B5D] mt-1">
                Order Number:{' '}
                <strong className="font-mono text-[#18261B]">{order.reference}</strong> · Dispatch
                Status:{' '}
                <strong className="text-[#0F5338] capitalize">
                  {order.status.replace(/_/g, ' ')}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="sm:text-right bg-[#F4FAF5] border border-[#DCE8DC] rounded-2xl px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6B5D]">
                Order Total (PKR)
              </p>
              <p
                data-testid="confirmation-total-pkr"
                className="text-xl font-mono font-bold text-[#0F5338] tabular-nums"
              >
                {formatPkr(orderTotalDisplayPkr)}
              </p>
            </div>
            <a
              href={waOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-4 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Strict Payment Verification Status Card */}
        <div
          data-testid="payment-status-banner"
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isPaidVerified
              ? 'bg-[#EBF8EE] border-[#12B326]/40 text-[#0F5338]'
              : isRejected
              ? 'bg-[#FFF5F5] border-[#E4483D]/40 text-[#9F241B]'
              : 'bg-[#F8FAF6] border-[#B7D7B9] text-[#18261B]'
          }`}
        >
          <div className="flex items-start gap-3">
            {isPaidVerified ? (
              <ShieldCheck className="w-5 h-5 text-[#12B326] shrink-0 mt-0.5" />
            ) : isRejected ? (
              <AlertCircle className="w-5 h-5 text-[#E4483D] shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-[#0F5338] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A6B5D]">
                  Payment Status:
                </span>
                <span
                  data-testid="payment-status-label"
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    isPaidVerified
                      ? 'bg-[#12B326] text-white'
                      : isRejected
                      ? 'bg-[#E4483D] text-white'
                      : 'bg-[#0F5338] text-white'
                  }`}
                >
                  {formatPaymentStatusLabel(order.paymentStatus)}
                </span>
              </div>
              <p className="text-xs text-[#4A5A4D] leading-relaxed">
                {isPaidVerified
                  ? `Your payment has been verified${
                      order.paymentDetails?.verifiedAt
                        ? ` on ${new Date(order.paymentDetails.verifiedAt).toLocaleString('en-PK')}`
                        : ''
                    }. Your fresh produce order is confirmed for dispatch.`
                  : isPendingVerification
                  ? 'We have received your payment details. Orders are never marked as Paid until our accounts team verifies your Transaction ID or receipt.'
                  : isRejected
                  ? order.paymentDetails?.verificationNote ||
                    'Your payment reference could not be verified. Please submit a clear payment receipt or valid Transaction ID below.'
                  : 'Payable in PKR upon produce delivery at your Lahore address, or submit an online transfer proof below.'}
              </p>
            </div>
          </div>

          {!isPaidVerified && (
            <button
              type="button"
              onClick={() => setShowProofForm((v) => !v)}
              className="h-9 px-3.5 rounded-xl border border-[#0F5338] bg-white text-xs font-semibold text-[#0F5338] hover:bg-[#0F5338] hover:text-white shrink-0 transition-colors"
            >
              {showProofForm
                ? 'Hide Proof Form'
                : order.paymentDetails?.transactionId || order.paymentDetails?.receiptDataUrl
                ? 'Update Payment Proof'
                : 'Submit Payment Proof'}
            </button>
          )}
        </div>

        {proofSuccess && (
          <div className="p-3.5 rounded-2xl bg-[#EBF8EE] border border-[#12B326]/35 text-xs font-medium text-[#0F5338]">
            {proofSuccess}
          </div>
        )}

        {/* Inline Payment Proof Update Form */}
        {showProofForm && !isPaidVerified && (
          <form
            onSubmit={handleSubmitProof}
            className="p-5 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] space-y-4"
          >
            <h3 className="text-sm font-bold text-[#18261B]">
              Submit or Update Payment Verification Proof
            </h3>
            {proofError && <p className="text-xs text-[#E4483D] font-medium">{proofError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="conf-txn-id"
                  className="block text-xs font-semibold text-[#18261B] mb-1"
                >
                  Transaction / Reference ID
                </label>
                <input
                  id="conf-txn-id"
                  type="text"
                  placeholder="e.g., TXN-94820155"
                  value={txnInput}
                  onChange={(e) => setTxnInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#DCE8DC] text-sm font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="conf-sender"
                  className="block text-xs font-semibold text-[#18261B] mb-1"
                >
                  Sender Name / Account Note (Optional)
                </label>
                <input
                  id="conf-sender"
                  type="text"
                  placeholder="Account holder name"
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#DCE8DC] text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="conf-receipt-file"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-[#DCE8DC] hover:border-[#12B326] text-xs font-semibold text-[#0F5338] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {receiptFileName ? `Selected: ${receiptFileName}` : 'Upload Payment Receipt Image'}
                </span>
                <input
                  id="conf-receipt-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleReceiptChange}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={submittingProof}
                className="h-10 px-5 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                {submittingProof && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Payment Proof</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProofForm(false)}
                className="h-10 px-4 rounded-xl border border-[#DCE8DC] bg-white text-xs font-semibold text-[#5A6B5D]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Submitted Payment Reference & Receipt Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E4ECE4] text-sm">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-[#18261B]">Customer &amp; Delivery Address</h3>
            <p className="text-[#4A5A4D] font-medium">{order.contact.fullName}</p>
            <p className="text-[#5A6B5D] font-mono text-xs">{order.contact.phone}</p>
            <p className="text-[#5A6B5D] text-xs">{order.contact.email}</p>
            <p className="text-[#4A5A4D] pt-1">
              {order.shippingAddress.streetAddress}
              {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}
            </p>
            <p className="text-[#5A6B5D] text-xs">
              {order.shippingAddress.zoneName}
              {order.shippingAddress.zoneName
                .toLowerCase()
                .includes(order.shippingAddress.city.trim().toLowerCase())
                ? ''
                : `, ${order.shippingAddress.city}`}
              , {order.shippingAddress.province}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#18261B]">Payment &amp; Reference Details</h3>
            <p className="text-xs text-[#4A5A4D]">
              <span className="text-[#5A6B5D]">Method:</span>{' '}
              <strong>{formatPaymentMethodLabel(order.paymentMethod, settings)}</strong>
            </p>
            {order.paymentDetails?.transactionId && (
              <p className="text-xs text-[#4A5A4D]">
                <span className="text-[#5A6B5D]">Transaction Reference:</span>{' '}
                <strong className="font-mono text-[#0F5338]">
                  {order.paymentDetails.transactionId}
                </strong>
              </p>
            )}
            {order.paymentDetails?.senderInfo && (
              <p className="text-xs text-[#4A5A4D]">
                <span className="text-[#5A6B5D]">Sender Info:</span>{' '}
                <span>{order.paymentDetails.senderInfo}</span>
              </p>
            )}
            {order.paymentDetails?.receiptDataUrl && (
              <div className="pt-1 flex items-center gap-3">
                <img
                  src={order.paymentDetails.receiptDataUrl}
                  alt="Submitted payment receipt"
                  className="w-16 h-16 rounded-xl object-cover border border-[#DCE8DC] bg-[#F4FAF5]"
                />
                <div className="text-xs">
                  <p className="font-semibold text-[#0F5338] flex items-center gap-1">
                    <FileImage className="w-3.5 h-3.5 text-[#12B326]" />
                    <span>Payment Receipt Uploaded</span>
                  </p>
                  <p className="text-[#5A6B5D] text-[11px]">
                    {order.paymentDetails.receiptFileName || 'Attached for verification'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Items & PKR Breakdown */}
        <div className="pt-4 border-t border-[#E4ECE4]">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#18261B] mb-3">Ordered Produce</h2>
          <ul className="divide-y divide-[#E4ECE4]">
            {order.items.map((item, idx) => (
              <li
                key={`${item.productId}-${idx}`}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <span className="font-semibold text-[#18261B]">{item.productName}</span>
                  <span className="text-[#5A6B5D] ml-2 text-xs tabular-nums">
                    ({item.selectedPackage}) x {item.quantity}
                  </span>
                </div>
                <span className="font-mono font-semibold text-[#18261B] tabular-nums">
                  {formatPkr(item.lineTotalPkr)}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#DCE8DC] space-y-1.5 text-sm">
            <div className="flex justify-between text-[#5A6B5D]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatPkr(order.subtotalPkr)}</span>
            </div>
            <div className="flex justify-between text-[#5A6B5D]">
              <span>Delivery</span>
              <span className="font-mono text-xs sm:text-sm tabular-nums">
                {order.deliveryFeePkr !== null
                  ? formatPkr(order.deliveryFeePkr)
                  : order.deliveryNote}
              </span>
            </div>
            {order.taxPkr > 0 && (
              <div className="flex justify-between text-[#5A6B5D]">
                <span>Applicable Tax</span>
                <span className="font-mono tabular-nums">{formatPkr(order.taxPkr)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2.5 border-t border-[#DCE8DC] text-base font-bold text-[#18261B]">
              <span>Total Amount (PKR)</span>
              <span className="font-mono text-[#0F5338] tabular-nums">
                {formatPkr(orderTotalDisplayPkr)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Order Notification Card (+923334934403) */}
      <div className="bg-white rounded-3xl border border-[#DCE8DC] p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F5338]">
              <MessageCircle className="w-4 h-4 text-[#12B326]" />
              <span>WhatsApp Order Notification ({recipientWhatsApp})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#18261B]">
              {order.whatsappNotification?.deliveredAutomatically
                ? 'Automatic WhatsApp Notification Sent'
                : 'Send Your Prefilled Order Summary on WhatsApp'}
            </h2>
            <p className="text-xs text-[#5A6B5D] leading-relaxed">
              {order.whatsappNotification?.deliveredAutomatically
                ? order.whatsappNotification.statusMessage
                : `Click below to send your complete order number, payment status, items, PKR total, address, and transaction reference directly to ${recipientWhatsApp}.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href={waOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="whatsapp-order-button"
              className="h-11 px-5 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Order on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopyWhatsAppMessage}
              className="h-11 px-4 rounded-2xl border border-[#DCE8DC] bg-[#F4FAF5] hover:border-[#12B326] text-xs font-semibold text-[#0F5338] inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedWa ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#12B326]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prefilled Message Preview */}
        <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F5338] mb-2">
            Prefilled WhatsApp Order Notification Preview
          </p>
          <pre className="text-xs font-mono text-[#233326] whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {waMessageText}
          </pre>
        </div>

        {/* Footer Support Row */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5A6B5D]">
          <p className="inline-flex items-start sm:items-center gap-2 leading-relaxed">
            <Phone className="w-3.5 h-3.5 text-[#12B326] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Dispatch Support: {settings.phoneDisplay} · {settings.address}
            </span>
          </p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="h-9 px-4 rounded-xl border border-[#DCE8DC] bg-white hover:border-[#12B326] text-xs font-semibold text-[#18261B] self-start sm:self-auto shrink-0"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
