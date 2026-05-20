# Product FAQ — Acme CRM

**Owner:** Product & Support | **Last updated:** March 2026

This document is for internal staff. For the public-facing help centre, visit **help.acmecrm.com**.

---

## What is Acme CRM?

Acme CRM is a cloud-based customer relationship management platform designed for small and mid-sized businesses (SMBs). It helps sales teams manage contacts, track deals through a pipeline, automate follow-ups, and generate reports — all in one place.

Key capabilities:
- **Contact management:** Unified records with full activity history, linked emails, and notes
- **Deal pipeline:** Visual kanban-style pipeline with customisable stages and weighted forecasting
- **Email integration:** Two-way sync with Gmail and Outlook; email sequences for automated follow-up
- **Reporting:** 30+ built-in reports; custom report builder available on Pro and Enterprise plans
- **Integrations:** 150+ native integrations including Slack, HubSpot Marketing, Xero, QuickBooks, and Zapier
- **Mobile apps:** iOS and Android apps with offline contact access

---

## Pricing

| Plan | Price | Users | Key limits |
|---|---|---|---|
| **Starter** | £29/month (billed annually) | Up to 3 users | 5,000 contacts, 10 pipelines, email sync |
| **Pro** | £79/month (billed annually) | Up to 10 users | Unlimited contacts, custom reports, API access |
| **Enterprise** | Custom pricing | Unlimited users | SSO, dedicated support, SLA, custom integrations |

Prices are per account (not per user) for Starter and Pro. Monthly billing is available at a 15% premium.

For accounts with 10+ users on Pro, customers should contact **sales@acmecrm.com** for a volume discount.

---

## Free Trial

New accounts can try Acme CRM free for **14 days** with no credit card required. The trial includes full Pro-plan functionality. At the end of the trial, accounts revert to a read-only view until a subscription is activated.

Trial accounts can be extended by 7 days once by contacting support. Extensions are not available for accounts that have already entered payment details.

---

## Getting Started

After signing up, the onboarding wizard takes about 15 minutes to:
1. Import contacts from a CSV, Gmail, or Outlook
2. Set up your first pipeline with your chosen stages
3. Connect your email for two-way sync
4. Invite your team members

Video walkthroughs are available at **help.acmecrm.com/getting-started**. The onboarding team also offers a free 30-minute setup call for Pro and Enterprise customers — book via the in-app chat.

---

## API & Integrations

**REST API:** Full API documentation is at **api.acmecrm.com/docs**. The API uses OAuth 2.0 bearer tokens. Rate limits apply:
- Starter: 100 requests/minute
- Pro: 500 requests/minute
- Enterprise: 2,000 requests/minute (customisable)

**Webhooks:** Available on Pro and Enterprise. Subscribe to events such as `deal.won`, `contact.created`, or `task.completed` to trigger workflows in other systems.

**Zapier:** The Acme CRM Zapier app (available on the Zapier app directory) allows no-code integration with 5,000+ apps without needing the API.

**Native integrations:** Configuration guides for all 150+ integrations are at **help.acmecrm.com/integrations**. The most popular integrations are Slack (deal notifications), Xero (sync won deals to invoices), and Mailchimp (sync contacts to mailing lists).

---

## Data & Security

**Hosting:** All data is hosted on AWS (eu-west-2 / London region). Enterprise customers may request an EU-only data residency addendum.

**Compliance:**
- **ISO 27001** certified (certificate number: ACME-ISO-2024-001)
- **SOC 2 Type II** compliant (report available under NDA for Enterprise customers)
- **GDPR:** Acme acts as a data processor for your customer data. A Data Processing Agreement (DPA) is available at acmecrm.com/legal/dpa.

**Encryption:** Data encrypted at rest (AES-256) and in transit (TLS 1.2+). No exceptions.

**Backups:** Automated daily backups with a 30-day retention period. Point-in-time restore available for Enterprise customers.

**Penetration testing:** Annual third-party penetration tests. Summaries available for Enterprise customers under NDA.

---

## Support

| Plan | Support channel | Response time target |
|---|---|---|
| Starter | Email | 2 business days |
| Pro | Email + live chat | 8 business hours |
| Enterprise | Email, chat, phone | 4 business hours (SLA) |

**Email:** support@acmecrm.com  
**Live chat:** Available in-app (bottom-right corner) during business hours Mon–Fri 09:00–17:30 GMT  
**Phone (Enterprise only):** +44 (0)20 7946 0200

**Status page:** system status and incident history at **status.acmecrm.com**. Subscribe for email or Slack alerts.

For feature requests, submit via the in-app **Feedback** button. Requests are reviewed monthly by Product and added to the public roadmap if prioritised.

---

## Billing & Account Management

Billing is managed through the **Account Settings > Billing** page by the account owner. Invoices are emailed on the billing anniversary date. Accepted payment methods: Visa, Mastercard, AMEX, and SEPA direct debit (EU accounts only).

To downgrade or cancel, navigate to **Account Settings > Plan**. Cancellations take effect at the end of the current billing period — there are no pro-rata refunds for partial periods. Data export is available for 30 days after cancellation.

For invoicing queries or purchase orders (Enterprise), contact **billing@acmecrm.com**.

---

## Frequently Asked Questions from Customers

**Can I migrate data from Salesforce / HubSpot / Pipedrive?**  
Yes. We provide a free migration service for Pro and Enterprise accounts. Contact support to book a migration call.

**Does Acme CRM work offline?**  
The mobile apps support read-only offline access for contacts and recent activity. Changes sync when connectivity is restored. The web app requires an internet connection.

**Can I white-label or resell Acme CRM?**  
A reseller programme is available for agencies and consultants. Contact **partners@acmecrm.com**.

**Is there a nonprofit or startup discount?**  
Registered nonprofits and pre-seed/seed-stage startups (under 2 years old, under £500k raised) may apply for a 40% discount. Email **discounts@acmecrm.com** with supporting documentation.
