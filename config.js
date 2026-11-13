// ============================================================
//  Muskan's Lifetime Treats Pass: settings YOU control
//  Change anything here, commit to GitHub, and her app updates.
// ============================================================
window.PASS_CONFIG = {
  holderName: "Muskan",
  issuerName: "Bhai",

  // Treat budget in rupees. It does NOT reset by itself: every order adds up
  // until you refresh it. Muskan sees it in her app but can always order more.
  // Orders inside the budget reach you silently; orders past it make a sound.
  budget: 2000,

  // To refresh the budget someday, change this to 2 (then 3, 4…).
  // Her used amount goes back to ₹0; her past orders stay in her history.
  budgetRound: 1,

  // Show Muskan the budget bar?
  showLimitToHer: true,

  // The secret pass code is NOT stored here (this file is public on GitHub).
  // It lives only in the card's QR link (…/#k=CODE) and on her phone.
  // Your ntfy topic = topicPrefix + CODE, e.g. "treats-abcd1234".
  topicPrefix: "treats-",

  // Bhai's Desk lock. Only a fingerprint (SHA-256) of your desk key is stored
  // here, so the key itself can't be read from GitHub. Muskan's pass code
  // alone can't open the desk.
  deskKeyHash: "7806bbebb0ea4e39b6e5e957dae929b2559c03e63de2703573cb7f832102eed9",

  ntfyServer: "https://ntfy.sh",
};
