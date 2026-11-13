# Muskan's Lifetime Treats Pass 🐟

## 1. Put it online (GitHub Pages, ~5 min)
1. On github.com, create a new **public** repo named `eats-pass`.
2. **Add file → Upload files**, then drag in everything from this folder (keep the `icons` folder).
3. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. After a minute the site is live at `https://<your-username>.github.io/eats-pass/`.

## 2. Get notifications on your phone (~2 min)
1. Install **ntfy** (App Store / Play Store).
2. Tap **+**, then subscribe to the topic in `config.js` → `ordersTopic` (server: ntfy.sh).
3. Open the site yourself and send a test order to check it arrives. Then hold the alert button to test that too.
   - Within the budget: silent notification, no sound.
   - Past the budget: she can still order. You get a normal notification with a sound, marked "over budget".
   - "Need you, Bhai" alert: max priority, with **I'm on it**, **Call**, and her location (if she allows it).
   - On **iPhone**, allow ntfy *Time Sensitive* notifications so the alert breaks through Focus.
     On **Android**, open the topic's settings in ntfy and allow it to override Do Not Disturb.

## 3. Print the card
1. On a laptop, open `https://<your-username>.github.io/eats-pass/card.html` in Chrome.
2. **Print → Save as PDF**, Margins: *None*, ✅ *Background graphics*.
3. Give the 2-page PDF to a card printer (PVC, CR80 size, front + back). It includes a 3 mm bleed.
   The dashed red lines are guides and don't print.

## 4. Muskan installs it
Scan the card → Safari opens it → **Share → Add to Home Screen**. She adds her address,
phone and UPI ID once (they're saved only on her phone).

## Changing things later
- **Budget:** ₹2,000 in total, with no monthly reset. To refresh it, change `budgetRound` in `config.js` from 1 to 2 (then 3…).
  Her used amount goes back to ₹0. To change the amount itself, edit `budget`.
- **Names, topics:** edit `config.js` on GitHub. Her app picks it up next time she opens it.
- **Move the app somewhere else:** replace `index.html` with a redirect. The printed QR keeps working:
  `<meta http-equiv="refresh" content="0; url=https://new-address">`
- **Getting spam?** Change both topic names in `config.js` and re-subscribe in ntfy.

Note: the "Pay ₹X" button opens UPI directly on Android. On iPhone, if it doesn't open your UPI app,
copy her UPI ID from the notification text.

Fonts: Dancing Script and Quicksand (SIL Open Font License, see `fonts/`).
