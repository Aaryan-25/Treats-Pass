(() => {
  const C = window.PASS_CONFIG;
  const $ = (id) => document.getElementById(id);
  const K = {
    pass: "desk.pass", key: "desk.key", records: "desk.records", status: "desk.status",
    lastData: "desk.lastData", lastReply: "desk.lastReply",
  };
  const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const when = (ts) => new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const clean = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3000);
  }
  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k in e) e[k] = v; else e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) e.append(kid);
    return e;
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // ---------- unlock ----------
  const hash = new URLSearchParams(location.hash.slice(1));
  let pass = clean(hash.get("k")) || load(K.pass, "");
  let key = clean(hash.get("d")) || load(K.key, "");
  if (location.hash) history.replaceState(null, "", location.pathname); // don't leave keys in the address bar

  const dataTopic = () => C.topicPrefix + pass + "-d";
  const replyTopic = () => C.topicPrefix + pass + "-r";

  async function unlocked() {
    return pass.length >= 8 && key.length >= 8 && (await sha256(key)) === C.deskKeyHash;
  }

  function showLock(msg) {
    $("app").hidden = true;
    $("passCode").value = pass ? pass.slice(0, 4) + "-" + pass.slice(4) : "";
    $("deskKey").value = "";
    $("lock").showModal();
    if (msg) toast(msg);
  }
  $("lock").addEventListener("cancel", (e) => e.preventDefault()); // can't dismiss without the key
  $("lockForm").onsubmit = async (e) => {
    e.preventDefault();
    const k = clean($("deskKey").value), p = clean($("passCode").value);
    if ((await sha256(k)) !== C.deskKeyHash) return toast("That desk key isn't right");
    if (p.length < 8) return toast("Check Muskan's pass code");
    key = k; pass = p; save(K.key, key); save(K.pass, pass);
    $("lock").close(); start();
  };

  // ---------- data ----------
  let records = load(K.records, {});
  let status = load(K.status, {});
  let notesSent = [];

  async function pollTopic(topic, sinceKey, onMsg) {
    const since = load(sinceKey, null) || "12h";
    const res = await fetch(`${C.ntfyServer}/${topic}/json?poll=1&since=${encodeURIComponent(since)}`);
    if (!res.ok) throw new Error(res.status);
    for (const line of (await res.text()).split("\n")) {
      if (!line.trim()) continue;
      let m; try { m = JSON.parse(line); } catch { continue; }
      if (m.event !== "message") continue;
      save(sinceKey, m.id);
      onMsg(m);
    }
  }

  async function sync() {
    try {
      await pollTopic(dataTopic(), K.lastData, (m) => {
        let r; try { r = JSON.parse(m.message); } catch { return; }
        if (r && r.id) records[r.id] = r;
      });
      await pollTopic(replyTopic(), K.lastReply, (m) => {
        const msg = String(m.message || "");
        const [verb, id, value] = msg.split(":");
        if (verb === "seen" && id) status[id] = "seen";
        if (verb === "status" && id && value) status[id] = value;
      });
      // keep the newest 300 records
      const ids = Object.keys(records).sort((a, b) => records[b].ts - records[a].ts);
      for (const id of ids.slice(300)) delete records[id];
      save(K.records, records); save(K.status, status);
      $("syncText").textContent = "Synced " + new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      render();
    } catch {
      $("syncText").textContent = "Couldn't sync. Check your internet";
    }
  }

  async function reply(body) {
    const res = await fetch(`${C.ntfyServer}/${replyTopic()}`, { method: "POST", body });
    if (!res.ok) throw new Error(res.status);
  }

  async function setStatus(id, value, okMsg) {
    try { await reply(`${value === "seen" ? "seen:" + id : "status:" + id + ":" + value}`); status[id] = value; save(K.status, status); render(); toast(okMsg); }
    catch { toast("Couldn't send. Try again"); }
  }

  async function sendNote(text) {
    text = text.trim();
    if (!text) return;
    try { await reply("note:" + text); $("noteInput").value = ""; toast("Sent to Muskan 💌"); }
    catch { toast("Couldn't send. Try again"); }
  }

  // ---------- render ----------
  const upiLink = (r) =>
    `upi://pay?pa=${encodeURIComponent(r.upi)}&pn=${encodeURIComponent(C.holderName)}&am=${r.amount}&cu=INR&tn=${encodeURIComponent("Treats Pass")}`;

  function render() {
    const list = Object.values(records).sort((a, b) => b.ts - a.ts);

    // budget: her app reports the running total with every order
    const current = list.filter((r) => r.kind === "order" && (r.round ?? 1) === C.budgetRound);
    const spent = current.length ? Math.max(...current.map((r) => Number(r.spent || 0))) : 0;
    $("budgetText").textContent = `${rupee(spent)} / ${rupee(C.budget)}`;
    $("budgetFill").style.width = Math.min(100, Math.round((spent / C.budget) * 100)) + "%";
    $("budgetBar").classList.toggle("over", spent > C.budget);
    $("budgetHint").textContent = spent > C.budget
      ? `She's ${rupee(spent - C.budget)} past the budget. She can still order.`
      : `${rupee(C.budget - spent)} left before orders start buzzing you.`;

    // alerts not yet answered
    const alerts = $("alerts"); alerts.textContent = "";
    for (const r of list.filter((x) => x.kind === "sos" && status[x.id] !== "seen")) {
      alerts.append(el("div", { className: "alert-card" },
        el("h3", {}, "🚨 Muskan sent a big alert"),
        el("p", { className: "o-time" }, when(r.ts)),
        el("div", { className: "o-actions" },
          el("button", { className: "done", on: { click: () => setStatus(r.id, "seen", "She'll see you're on it 🫶") } }, "I'm on it"),
          r.phone && el("a", { href: "tel:" + r.phone }, "Call her"),
          r.loc && el("a", { href: r.loc, target: "_blank", rel: "noopener" }, "Her location"))));
    }

    // orders
    const ul = $("orders"); ul.textContent = "";
    if (!list.length) { ul.append(el("p", { className: "empty" }, "No orders yet. They show up here when she sends one.")); return; }
    for (const r of list) {
      const st = status[r.id];
      if (r.kind === "sos") {
        ul.append(el("li", {}, el("div", { className: "o-top" }, el("span", { className: "o-amt" }, "🚨 Alert"), el("span", { className: "o-time" }, when(r.ts))),
          el("div", { className: "o-tags" }, el("span", { className: "badge " + (st === "seen" ? "ok" : "sos") }, st === "seen" ? "You answered" : "Not answered"))));
        continue;
      }
      const isOrderForHer = r.mode === "order";
      const doneValue = isOrderForHer ? "ordered" : "paid";
      const doneLabel = isOrderForHer ? (st === "ordered" ? "Ordered ✓" : "I ordered it 🛵") : (st === "paid" ? "Paid ✓" : "Mark paid ✅");
      ul.append(el("li", {},
        el("div", { className: "o-top" }, el("span", { className: "o-amt" }, rupee(r.amount)), el("span", { className: "o-time" }, when(r.ts))),
        r.notes && el("p", { className: "o-notes" }, r.notes),
        isOrderForHer && r.address && el("p", { className: "o-line" }, "📍 " + r.address),
        isOrderForHer && r.phone && el("p", { className: "o-line" }, "📞 " + r.phone),
        !isOrderForHer && r.upi && el("p", { className: "o-line" }, "💸 " + r.upi),
        el("div", { className: "o-tags" },
          el("span", { className: "badge ok" }, isOrderForHer ? "You order it" : "She ordered, pay back"),
          r.over && el("span", { className: "badge over" }, "Over budget")),
        el("div", { className: "o-actions" },
          r.link && el("a", { href: r.link, target: "_blank", rel: "noopener" }, "Open link"),
          isOrderForHer && r.address && el("button", { on: { click: () => navigator.clipboard?.writeText(r.address).then(() => toast("Address copied"), () => toast("Couldn't copy")) } }, "Copy address"),
          !isOrderForHer && r.upi && el("a", { href: upiLink(r) }, "Pay " + rupee(r.amount)),
          el("button", { className: "done", disabled: st === doneValue, on: { click: () => setStatus(r.id, doneValue, isOrderForHer ? "She'll see it's on the way 🛵" : "She'll see you paid ✅") } }, doneLabel))));
    }
  }

  // ---------- wiring ----------
  ["Enjoy! 😋", "Ordering now 🛵", "Paid you ✅", "Calling you 📞"].forEach((t) =>
    $("chips").append(el("button", { type: "button", on: { click: () => sendNote(t) } }, t)));
  $("noteSend").onclick = () => sendNote($("noteInput").value);
  $("noteInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendNote($("noteInput").value); });
  $("refreshBtn").onclick = () => { toast("Syncing…"); sync(); };
  $("clearBtn").onclick = () => {
    if (!confirm("Clear all orders from this phone? (Her app isn't affected.)")) return;
    records = {}; status = {}; save(K.records, records); save(K.status, status); render(); toast("Cleared");
  };
  $("lockBtn").onclick = () => { localStorage.removeItem(K.key); key = ""; showLock("Desk locked"); };

  // Link to edit config.js on GitHub (works for <user>.github.io/<repo>/)
  const user = location.hostname.split(".")[0];
  const repo = location.pathname.split("/").filter(Boolean)[0];
  $("editConfig").href = location.hostname.endsWith("github.io") && repo
    ? `https://github.com/${user}/${repo}/edit/main/config.js` : "https://github.com";

  let timer;
  async function start() {
    if (!(await unlocked())) return showLock();
    save(K.key, key); save(K.pass, pass);
    $("app").hidden = false;
    render(); sync();
    clearInterval(timer);
    timer = setInterval(() => { if (document.visibilityState === "visible") sync(); }, 10000);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !$("app").hidden) sync(); });

  start();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
