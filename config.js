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

  // Secret ntfy channels. Subscribe to `ordersTopic` in the ntfy app on your
  // phone. Keep these private; change them if you ever get spam.
  ordersTopic: "muskan-eats-8532c74a5b11",
  // Your "I'm on it" button on her alerts replies here; her app listens.
  replyTopic: "muskan-eats-8532c74a5b11-reply",

  ntfyServer: "https://ntfy.sh",
};
