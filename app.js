(() => {
  const C = window.PASS_CONFIG;
  const $ = (id) => document.getElementById(id);
  const KEY = { orders: "eats.orders", me: "eats.me", lastReply: "eats.lastReply" };

  // ---------- storage (wrapped: storage can throw in private mode) ----------
  const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let orders = load(KEY.orders, []);
  let me = load(KEY.me, { address: "", phone: "", upi: "" });

  const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const uid = () => Math.random().toString(36).slice(2, 8);

  // Total used in the current budget round (no time limit; resets only when Bhai bumps budgetRound).
  function budgetSpent() {
    return orders
      .filter((o) => o.kind === "order" && (o.round ?? 1) === C.budgetRound)
      .reduce((s, o) => s + Number(o.amount || 0), 0);
  }

  // ---------- UI ----------
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function renderMeter() {
    if (!C.showLimitToHer) { $("meterWrap").hidden = true; return; }
    const spent = budgetSpent();
    const over = spent > C.budget;
    $("meterText").textContent = `${rupee(spent)} / ${rupee(C.budget)}`;
    $("meterFill").style.width = Math.min(100, Math.round((spent / C.budget) * 100)) + "%";
    $("meterBar").classList.toggle("over", over);
    $("meterNote").hidden = !over;
    $("meterNote").textContent = "You're past the budget. That's okay, order whatever you like ♡";
  }

  function renderAddress() {
    const p = $("addrLine"); p.textContent = "";
    if (me.address) {
      p.append("Delivering to: " + me.address.split("\n")[0] + " · ");
    } else {
      p.append("No address saved yet · ");
    }
    const b = document.createElement("button"); b.type = "button"; b.textContent = me.address ? "edit" : "add one";
    b.onclick = openSettings; p.append(b);
  }

  const STATUS = {
    ok: ["Sent ♡", "ok"], over: ["Over budget", "over"],
    sent: ["Alert sent", "sos"], seen: ["Bhai's on it 🫶", "ok"],
  };

  function renderHistory() {
    const ul = $("history"); ul.textContent = "";
    const recent = orders.slice(-8).reverse();
    if (!recent.length) {
      const li = document.createElement("p"); li.className = "empty"; li.textContent = "Nothing yet. Go treat yourself 🐟";
      ul.append(li); return;
    }
    for (const o of recent) {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = o.kind === "sos" ? "🚨 Big alert" : `${rupee(o.amount)}${o.notes ? " · " + o.notes : ""}`;
      const meta = document.createElement("div"); meta.className = "meta";
      meta.textContent = new Date(o.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
      left.append(title, meta);
      const [label, cls] = STATUS[o.status] || ["", ""];
      const badge = document.createElement("span"); badge.className = "badge " + cls; badge.textContent = label;
      li.append(left, badge); ul.append(li);
    }
  }

  function renderAll() { $("holderName").textContent = C.holderName; renderMeter(); renderAddress(); renderHistory(); }

  // ---------- settings ----------
  function openSettings() {
    $("setAddress").value = me.address; $("setPhone").value = me.phone; $("setUpi").value = me.upi;
    $("settings").showModal();
  }
  $("openSettings").onclick = openSettings;
  $("saveSettings").onclick = () => {
    me = { address: $("setAddress").value.trim(), phone: $("setPhone").value.trim(), upi: $("setUpi").value.trim() };
    save(KEY.me, me); renderAddress(); toast("Saved");
  };

  // ---------- paste ----------
  const extractUrl = (text) => (text.match(/https?:\/\/[^\s"'<>]+/) || [""])[0];
  $("pasteBtn").onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractUrl(text);
      if (url) { $("link").value = url; } else { toast("No link found in what you copied"); }
    } catch { $("link").focus(); toast("Long-press the box and tap Paste"); }
  };
  $("link").addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const url = extractUrl(text);
    if (url && url !== text) { e.preventDefault(); $("link").value = url; }
  });

  // ---------- ntfy ----------
  async function publish(payload) {
    const res = await fetch(C.ntfyServer, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: C.ordersTopic, ...payload }),
    });
    if (!res.ok) throw new Error("ntfy " + res.status);
  }

  const replyAction = (label, body) => ({
    action: "http", label, url: `${C.ntfyServer}/${C.replyTopic}`, method: "POST", body, clear: true,
  });

  const upiLink = (amount) =>
    `upi://pay?pa=${encodeURIComponent(me.upi)}&pn=${encodeURIComponent(C.holderName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Eats Pass")}`;

  // ---------- send order ----------
  $("sendBtn").onclick = async () => {
    const link = extractUrl($("link").value) || $("link").value.trim();
    const amount = Math.round(Number($("amount").value));
    const notes = $("notes").value.trim();
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (!link && !notes) return toast("Paste a link or write what you want");
    if (!amount || amount < 0) return toast("Add a rough amount");
    if (mode === "order" && !me.address) { toast("Add your address first"); return openSettings(); }

    const spentBefore = budgetSpent();
    const within = spentBefore + amount <= C.budget;
    const id = uid();

    const lines = [
      mode === "order" ? "🛵 Please order this for me" : "✅ I'll order. Pay me back",
      notes && `📝 ${notes}`,
      link && `🔗 ${link}`,
      mode === "order" && `📍 ${me.address}`,
      mode === "order" && me.phone && `📞 ${me.phone}`,
      mode === "payback" && me.upi && `💸 UPI: ${me.upi}`,
      `📊 Budget used: ${rupee(spentBefore + amount)} of ${rupee(C.budget)}`,
    ].filter(Boolean);

    const actions = [];
    if (link) actions.push({ action: "view", label: "Open link", url: link });
    if (mode === "payback" && me.upi) actions.push({ action: "view", label: `Pay ${rupee(amount)}`, url: upiLink(amount) });

    const btn = $("sendBtn"); btn.disabled = true; btn.textContent = "Sending…";
    try {
      await publish({
        title: within ? `🍜 ${C.holderName}: ${rupee(amount)}` : `🍜 ${C.holderName}: ${rupee(amount)} (over budget)`,
        message: lines.join("\n"),
        priority: within ? 1 : 3,
        tags: within ? ["fish"] : ["fish", "warning"],
        click: link || undefined,
        actions: actions.slice(0, 3),
      });
      orders.push({ id, ts: Date.now(), kind: "order", amount, link, notes, mode, round: C.budgetRound, status: within ? "ok" : "over" });
      save(KEY.orders, orders);
      $("link").value = ""; $("amount").value = ""; $("notes").value = "";
      renderAll();
      toast("Sent to Bhai! Enjoy ♡");
    } catch {
      toast("Couldn't send. Check your internet and try again");
    } finally { btn.disabled = false; btn.textContent = "Send to Bhai ♡"; }
  };

  // ---------- SOS (hold 1s) ----------
  const getLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`),
      () => resolve(null), { timeout: 5000, maximumAge: 60000 });
  });

  async function sendSOS() {
    const id = uid();
    toast("Sending alert…");
    const loc = await getLocation();
    const actions = [replyAction("I'm on it", `seen:${id}`)];
    if (me.phone) actions.push({ action: "view", label: `Call ${C.holderName}`, url: `tel:${me.phone}` });
    if (loc) actions.push({ action: "view", label: "Her location", url: loc });
    try {
      await publish({
        title: `🚨 ${C.holderName.toUpperCase()} SENT A BIG ALERT`,
        message: `Sent ${new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}${loc ? "\n📍 " + loc : ""}`,
        priority: 5, tags: ["rotating_light"], actions,
      });
      orders.push({ id, ts: Date.now(), kind: "sos", status: "sent" });
      save(KEY.orders, orders); renderHistory();
      toast("Alert sent. Bhai's been notified 🚨");
      navigator.vibrate?.(200);
    } catch { toast("Couldn't send. Check your internet"); }
  }

  const sos = $("sosBtn"); let holdTimer;
  const startHold = (e) => { e.preventDefault(); sos.classList.add("holding"); holdTimer = setTimeout(() => { sos.classList.remove("holding"); sendSOS(); }, 1000); };
  const cancelHold = () => { clearTimeout(holdTimer); sos.classList.remove("holding"); };
  sos.addEventListener("pointerdown", startHold);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => sos.addEventListener(ev, cancelHold));
  sos.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- replies from Bhai ----------
  async function pollReplies() {
    const since = load(KEY.lastReply, null) || "7d";
    try {
      const res = await fetch(`${C.ntfyServer}/${C.replyTopic}/json?poll=1&since=${encodeURIComponent(since)}`);
      if (!res.ok) return;
      const text = await res.text();
      let changed = false;
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.event !== "message") continue;
        save(KEY.lastReply, m.id);
        const [verb, oid] = String(m.message || "").split(":");
        const o = orders.find((x) => x.id === oid);
        if (!o) continue;
        if (verb === "seen" && o.status !== "seen") {
          o.status = "seen"; changed = true;
          toast("Bhai saw your alert. He's on it 🫶");
        }
      }
      if (changed) { save(KEY.orders, orders); renderAll(); }
    } catch {}
  }

  // ---------- boot ----------
  renderAll();
  if (!me.address) setTimeout(openSettings, 600);
  pollReplies();
  setInterval(() => { if (document.visibilityState === "visible") pollReplies(); }, 15000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pollReplies(); });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
