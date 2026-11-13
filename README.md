# Muskan's Lifetime Treats Pass 🐟

## 1. Put it online (GitHub Pages, ~5 min)
1. On github.com, create a new **public** repo named `eats-pass`.
2. **Add file → Upload files**, then drag in everything from this folder (keep the `icons` folder).
3. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. After a minute the site is live at `https://<your-username>.github.io/eats-pass/`.

## 2. Get notifications on your phone (~2 min)
1. Install **ntfy** (App Store / Play Store).
2. Tap **+**, then subscribe to `treats-` + your secret pass code (server: ntfy.sh).
   The code is NOT in this repo on purpose. It only lives in the card's QR link and on her phone.
3. Open the site yourself and send a test order to check it arrives. Then hold the alert button to test that too.
   - Within the budget: silent notification, no sound.
   - Past the budget: she can still order. You get a normal notification with a sound, marked "over budget".
   - "Need you, Bhai" alert: max priority, with **I'm on it**, **Call**, and her location (if she allows it).
   - On **Android**, each priority gets its own sound setting, and the alert can be allowed to override Do Not Disturb.
     On **iPhone**, ntfy can't yet break through silent mode or Focus, so the alert arrives like a normal notification.

## 3. Your side: Bhai's Desk
- Open `bhai.html` on your phone with your private link (desk key + her pass code), or open `bhai.html`
  and type both once. Then **Add to Home Screen**. It installs as its own app, "Bhai's Desk".
- It shows her orders, the budget used, and her alerts, and lets you reply: "I ordered it", "Paid",
  "I'm on it", or any message. She sees replies in her app.
- The desk key is NOT in this repo. Only its SHA-256 fingerprint is in `config.js`, so her pass code alone can't open the desk.
- The desk keeps its own copy of orders on your phone. ntfy.sh only holds messages for about 12 hours,
  so open the desk at least once in that window to capture every order in its history. Your ntfy app
  still gets every notification either way.

## 4. Print the card
Use the ready-made print PDF. To make a new one (for example, after changing the pass code):
1. On a laptop, open `card.html?code=YOURPASSCODE` on your site in Chrome. Without `code`, the QR won't carry her pass code.
2. **Print → Save as PDF**, Margins: *None*, ✅ *Background graphics*.
3. Give the 2-page PDF to a card printer (PVC, CR80 size, front + back). It includes a 3 mm bleed.
   The dashed red lines are guides and don't print.

## 5. Muskan installs it
Scan the card → Safari opens it → **Share → Add to Home Screen**. She adds her address,
phone and UPI ID once (they're saved only on her phone).

## Changing things later
- **Budget:** ₹2,000 in total, with no monthly reset. To refresh it, change `budgetRound` in `config.js` from 1 to 2 (then 3…).
  Her used amount goes back to ₹0. To change the amount itself, edit `budget`.
- **Names, topics:** edit `config.js` on GitHub. Her app picks it up next time she opens it.
- **Move the app somewhere else:** replace `index.html` with a redirect. The printed QR keeps working:
  `<meta http-equiv="refresh" content="0; url=https://new-address">`
- **Code leaked or getting spam?** Pick a new 8-character code, reprint the card's QR (`card.html?url=…&code=NEWCODE`) and re-subscribe in ntfy.

Note: the "Pay ₹X" button opens UPI directly on Android. On iPhone, if it doesn't open your UPI app,
copy her UPI ID from the notification text.

Fonts: Dancing Script and Quicksand (SIL Open Font License, see `fonts/`).
