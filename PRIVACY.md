# Correlache: Privacy Policy

Last updated: 2026-11-05

## 1. Who we are

Correlache ("the App", "we", "us") is a personal diary for logging headaches and workouts side by side, so you can look for patterns between them.

**Data controller:** Laura Greta Kotlinska, a student, as part of YRGO.
**Contact:** laura.devhub@gmail.com

Correlache is a **student project**, not a commercial service. There is no support team and no uptime guarantee. Please don't rely on it as your only record of your health.

## 2. What data we collect

### 2.1 Account data

- Username
- Email address
- Password, stored only as a salted hash (we cannot read your password)

### 2.2 Health data (special category data)

Headache entries you create:

- Start and end date and time
- Pain level (0–10)
- Locations on the head
- Triggers, symptoms and relief measures you select
- Any notes you write

### 2.3 Workout data

Workouts you log manually: the exercises, sets, reps, weight and similar details. Muscle groups and training volume are calculated from these. The Insights page uses them to compare your workouts with your headaches.

### 2.4 Technical data and cookies

- **Login cookie.** When you log in we set one cookie (`access_token`) containing a signed token. It is `HttpOnly`, lasts 24 hours, and is used only to keep you logged in. It is not used for advertising or tracking.
- **Drafts in your browser.** Unsaved headache and workout forms may be kept in your browser's session storage. This data stays on your device and is cleared when you log out or close the tab.

### 2.5 What we do not do

- We do not use analytics, advertising or tracking tools.
- We do not collect your location, contacts or device identifiers.

## 3. Why we process your data and our legal basis

| Purpose                                                   | Data used                  | Legal basis (GDPR)                                      |
| --------------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| Creating and managing your account, keeping you logged in | Account data, login cookie | Performance of the service you requested (Art. 6(1)(b)) |
| Letting you log and view headaches and workouts           | Health data, workout data  | Explicit consent (Art. 9(2)(a))                         |
| Showing patterns between your headaches and workouts      | Health data, workout data  | Explicit consent (Art. 9(2)(a))                         |

Headache records are health data, which GDPR treats as a special category. We rely on your **explicit consent**, which you give when you create an account and save headache entries. You can withdraw it at any time by deleting your entries or your account (Section 7). Withdrawing consent does not affect processing that happened before.

## 4. How your data is stored and secured

- The App runs on [Heroku](https://www.heroku.com), and data is stored in a MySQL database provided by the JawsDB add-on on Heroku, in the EU region.
- Data is sent over HTTPS in production.
- Passwords are hashed. The login cookie is `HttpOnly` and, in production, `Secure`.
- Only Laura Greta Kotlinska has administrative access to the Heroku app and the database.
- No system is perfectly secure. As a student project, the App has not been through a professional security audit.

## 5. Who we share data with

- We do not sell your data or share it for marketing.
- We use Heroku (a Salesforce company) to host the App, and JawsDB to provide the database. They process your data on our behalf, only to run the service. Heroku is US-based, so your data may be processed outside the EU/EEA; such transfers rely on the providers' safeguards, such as standard contractual clauses.
- Heroku may keep technical logs (such as IP addresses and request times) of traffic to the App for operating and troubleshooting the service.
- We may disclose data if the law requires it.

## 6. How long we keep your data

- Your data is kept while your account exists.
- You can delete your account at any time in **Settings → Delete account**. This immediately and permanently deletes your account, headaches and workouts. Backups held by JawsDB/Heroku may take up to [X days, check your JawsDB plan] to expire.

## 7. Your rights

Under GDPR you have the right to:

- **Access** the data we hold about you
- **Rectify** inaccurate data (you can edit your entries in the App)
- **Erase** your data (Settings → Delete account)
- **Restrict or object** to processing
- **Data portability**. The App has no export feature yet, so email us and we will send you your data in a common format (such as CSV or JSON)
- **Withdraw consent** at any time
- **Complain** to your national data protection authority

To use any of these rights, email laura.devhub@gmail.com.

## 8. Children

Correlache is not intended for children. We do not knowingly collect data from anyone under 13. If you believe a child has signed up, contact us and we will delete the account.

## 9. Changes to this policy

We may update this policy as the App develops. If the changes are significant we will tell you in the App. The "Last updated" date above always shows the current version.

## 10. Contact

Questions or requests about your data: laura.devhub@gmail.com
