# IT Helpdesk FAQ — Acme Software Ltd

**Owner:** IT Operations | **Last updated:** February 2026

---

## Getting Help

**Self-service portal:** helpdesk.acme.com  
**Email:** it@acme.com  
**Phone:** +44 (0)20 7946 0100 ext. 200 (Mon–Fri, 08:00–18:00 GMT)  
**Urgent out-of-hours:** +44 (0)7700 900999

All requests should be logged in the self-service portal where possible so they can be tracked and prioritised. Phone support is available for urgent issues where you cannot access the portal (e.g. locked out completely).

---

## Account & Password

### How do I reset my password?

1. Go to **helpdesk.acme.com** and click **Reset Password** (you do not need to be logged in).
2. Enter your company email address and click Send Code.
3. Enter the 6-digit code sent to your registered mobile number or backup email.
4. Set a new password. It must be at least 12 characters and include uppercase, lowercase, a number, and a special character.
5. Your new password is active immediately. You will be prompted to update it on devices you stay logged in to.

If you no longer have access to your registered mobile number, call the IT helpdesk directly for identity verification.

### My account is locked. What do I do?

Accounts lock after **5 failed login attempts**. Wait 15 minutes for an automatic unlock, or call the helpdesk for an immediate reset if urgent. Do not repeatedly retry — each failed attempt resets the 15-minute timer.

### How do I set up Multi-Factor Authentication (MFA)?

MFA is **mandatory** for all company accounts. We use Microsoft Authenticator.

1. Download **Microsoft Authenticator** from the App Store or Google Play.
2. Open the app and tap **Add Account > Work or School Account**.
3. Go to myaccount.microsoft.com on a browser and select **Security Info > Add Method > Authenticator App**.
4. Scan the QR code displayed on screen with the app.
5. Enter the 6-digit code to verify, then click Next.

If you lose your phone, contact the helpdesk immediately. Do not wait — your account must be secured.

---

## VPN & Remote Access

### How do I connect to the VPN?

Acme uses **Cisco AnyConnect** for remote access.

1. Download the client from helpdesk.acme.com > Downloads > VPN.
2. Install and launch Cisco AnyConnect.
3. In the server address field, enter: **vpn.acme.com**
4. Click Connect and authenticate with your company email and MFA code.
5. You are now connected to the Acme network. The VPN icon in your system tray will show green.

You must be connected to the VPN to access internal systems such as the HR portal, Finance tools, and internal file shares.

### VPN is connecting but I can't reach internal sites

Try disconnecting and reconnecting. If the problem persists, check that your operating system time and date are correct (incorrect clocks break MFA tokens). If still unresolved, raise a ticket.

---

## Hardware & Equipment

### How do I request a new laptop or equipment?

Raise a request in the helpdesk portal under **Hardware Request**. Include:
- The type of equipment needed
- A brief business justification
- Your manager's name for approval

Standard lead time is **5–10 business days**. Specialised equipment (e.g. high-spec workstations, external monitors for home offices) may take longer.

New starters should have their equipment ordered by HR as part of the onboarding process — they do not need to raise a separate ticket.

### My laptop is broken or damaged

Raise a **Hardware Fault** ticket immediately. For accidental damage, note that a brief report is required for insurance purposes — IT will provide the template. Do not attempt to repair hardware yourself; this may void the warranty and is a security risk.

### Can I use a personal device for work?

Limited access is available through the browser-based **Company Portal** (portal.acme.com) on personal devices. Full access to company systems and file shares requires an Acme-managed device. Speak to IT if your role requires broader personal device access.

---

## Software & Applications

### How do I request new software?

Raise a **Software Request** ticket in the helpdesk portal. Include:
- The software name and version
- A business justification (what problem does it solve?)
- Whether you need a paid licence or if a free/trial version is acceptable

IT will review the request for security and licence compliance. Approved requests are fulfilled within 5 business days. Do not install unapproved software on company devices — this violates the Acceptable Use Policy.

### Microsoft 365 apps aren't activating

Sign out of all Office apps, then sign in again with your company email. If Office says your account is unlicensed, raise a ticket — your licence may need to be reassigned.

### How do I set up email on my phone?

1. Open your phone's mail app (or download Outlook for iOS/Android).
2. Add a new account and select **Exchange/Microsoft 365**.
3. Enter your company email address; the server and other settings will auto-configure.
4. Authenticate with MFA when prompted.

---

## Printing & Files

### How do I connect to a network printer?

On Windows: Settings > Bluetooth & Devices > Printers > Add a printer > search for your office floor printer (e.g. `ACME-LDN-FL3-A3`). On Mac: System Settings > Printers & Scanners > Add Printer > search by name.

If the printer doesn't appear, ensure you are on the office Wi-Fi or VPN.

### Where should I save work files?

All work files must be saved to **OneDrive for Business** (automatically synced to your Documents folder) or to SharePoint team sites. Do not save work to your laptop's local drive only — it is not backed up and will be lost if the device fails.

---

## Security & Incidents

### I received a suspicious email — what do I do?

Do not click any links or open attachments. Forward the email as an attachment to **security@acme.com**, then delete it. If you accidentally clicked a link, call the IT helpdesk immediately — do not wait.

### I think my device or account has been compromised

Call the helpdesk immediately on +44 (0)20 7946 0100 ext. 200 or the out-of-hours number. Time is critical in security incidents.
