export const SMS_PARSE_SYSTEM_PROMPT = `You are a precise transaction extractor for Indian banking SMS messages.

Your only job is to read raw SMS text from Indian banks (HDFC, SBI, ICICI, Axis, Kotak) or UPI apps (PhonePe, Google Pay, Paytm, CRED) and return a single JSON object with these fields:

- amount (number, in rupees, no symbol, always positive)
- direction ("debit" if money went out, "credit" if money came in)
- merchant (string, the payee or source; keep it short and human-readable, e.g. "Swiggy", "Metro Card", "Amazon Pay")
- account_last4 (string of 4 digits if present, else null)
- occurred_at (ISO 8601 timestamp; if the SMS only has a date like "22-Apr-26", use 12:00 local IST that day; if no date is present at all, use null)
- category_hint (one of: "Food & Dining", "Groceries", "Transport", "Shopping", "Entertainment", "Bills & Utils", "Health", "Transfer", "Income", "Other"). Pick your best guess from merchant context.

Rules:
1. Output ONLY the JSON object. No prose, no markdown, no code fences.
2. If the SMS is not a transaction (e.g. OTP, marketing, balance alert with no transaction), return {"error": "not_a_transaction"}.
3. Infer direction carefully: words like "debited", "spent", "paid", "purchased", "deducted" mean debit. "Credited", "received", "refund" mean credit.
4. Indian date formats like "22-Apr-26" or "22/04/2026" should be interpreted as day-month-year.
5. Strip noisy merchant names (e.g. "SWIGGY BANGALORE" -> "Swiggy", "AMAZON PAY*AMZN" -> "Amazon Pay").
6. Do not invent data. If a field is genuinely absent, use null.`;

export const SMS_PARSE_EXAMPLES = [
  {
    sms: 'Rs.450.00 debited from a/c **4532 on 22-Apr-26 at SWIGGY BANGALORE. Avl Bal Rs.12,300. Not you? Call 18002586161. -HDFC Bank',
    expected: {
      amount: 450,
      direction: 'debit',
      merchant: 'Swiggy',
      account_last4: '4532',
      occurred_at: '2026-04-22T12:00:00+05:30',
      category_hint: 'Food & Dining',
    },
  },
  {
    sms: 'UPI/P2A/612345678901/PAID TO PHONEPE MERCHANT/PHONEPEPG@YBL - Rs 120 on 20/04/26. Ref 612345. -ICICI',
    expected: {
      amount: 120,
      direction: 'debit',
      merchant: 'PhonePe Merchant',
      account_last4: null,
      occurred_at: '2026-04-20T12:00:00+05:30',
      category_hint: 'Other',
    },
  },
];

export type ParsedSms = {
  amount: number;
  direction: 'debit' | 'credit';
  merchant: string;
  account_last4: string | null;
  occurred_at: string | null;
  category_hint: string;
};

export type ParsedSmsError = { error: string };
