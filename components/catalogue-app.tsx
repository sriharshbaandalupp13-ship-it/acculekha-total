"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  cat: string;
  description: string;
  unit: string;
  price: number;
  origPrice: number | null;
  gstRate: number;
  inStock: boolean;
  enabled: boolean;
  isNew: boolean;
  offer: string | null;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  videoUrl: string | null;
};

type ProductLike = Partial<Product> & {
  name?: string;
  slug?: string;
  cat?: string;
  description?: string;
  unit?: string;
  price?: number;
};

type CartLine = { productId: string; qty: number };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CatalogueApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cat, setCat] = useState<string>("all");
  const [admin, setAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void load();
    void fetch("/api/auth/admin/me").then((r) => r.json()).then((d) => setAdmin(Boolean(d.admin)));
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);

  async function load() {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = (await res.json()) as ProductLike[];
    const normalized = data.map((p, i) => ({
      id: String(p.id ?? p.slug ?? `local-${i}`),
      name: String(p.name ?? "Unnamed Product"),
      slug: String(p.slug ?? `product-${i}`),
      cat: String(p.cat ?? "software"),
      description: String(p.description ?? ""),
      unit: String(p.unit ?? "unit"),
      price: Number.isFinite(p.price) ? Number(p.price) : 0,
      origPrice: p.origPrice == null ? null : Number(p.origPrice),
      gstRate: Number.isFinite(p.gstRate) ? Number(p.gstRate) : 18,
      inStock: Boolean(p.inStock ?? true),
      enabled: Boolean(p.enabled ?? true),
      isNew: Boolean(p.isNew ?? false),
      offer: p.offer ?? null,
      image1: p.image1 ?? null,
      image2: p.image2 ?? null,
      image3: p.image3 ?? null,
      image4: p.image4 ?? null,
      videoUrl: p.videoUrl ?? null
    })) satisfies Product[];
    setProducts(normalized);
  }

  const visible = useMemo(
    () => products.filter((p) => p.enabled || admin).filter((p) => cat === "all" || p.cat === cat),
    [products, admin, cat]
  );

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);
  }, [cart, products]);

  async function loginAdmin() {
    const res = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return alert("Admin login failed");
    setAdmin(true);
    setShowAdmin(false);
    await load();
  }

  async function logoutAdmin() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    setAdmin(false);
    await load();
  }

  function addToCart(productId: string) {
    setCart((prev) => {
      const found = prev.find((x) => x.productId === productId);
      if (found) return prev.map((x) => (x.productId === productId ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { productId, qty: 1 }];
    });
  }

  async function placeOrder() {
    if (!cart.length) return;
    const customer = prompt("Customer name") || "";
    const phone = prompt("Phone") || "";
    const emailAddr = prompt("Email") || "";
    const address = prompt("Address") || "";
    const paymentMode = (prompt("Payment mode: online/cod", "cod") || "cod").toLowerCase() === "online" ? "online" : "cod";

    const otpSend = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    if (!otpSend.ok) return alert("OTP send failed");
    const otpData = await otpSend.json();
    const otp = prompt(`Enter OTP${otpData.demoOtp ? ` (demo: ${otpData.demoOtp})` : ""}`) || "";
    const otpVerify = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp })
    });
    if (!otpVerify.ok) return alert("OTP verification failed");

    if (paymentMode === "online") {
      const rp = await fetch("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(cartTotal * 1.18 * 100),
          receipt: `rcpt_${Date.now()}`
        })
      });
      if (!rp.ok) return alert("Razorpay order failed");
      const rpOrder = await rp.json();
      if (window.Razorpay) {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          order_id: rpOrder.id,
          name: "Acculekhaa",
          description: "Catalogue Order"
        });
        rzp.open();
      }
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        phone,
        email: emailAddr,
        address,
        paymentMode,
        lines: cart
      })
    });
    if (!res.ok) return alert("Order failed");
    alert("Order placed");
    setCart([]);
  }

  async function createInquiry(productId: string) {
    const name = prompt("Your name") || "";
    const phone = prompt("Phone") || "";
    const message = prompt("Message") || "";
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, message, productId })
    });
    if (!res.ok) return alert("Inquiry failed");
    alert("Inquiry sent");
  }

  async function patchProduct(id: string, data: Partial<Product>) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (res.ok) await load();
  }

  async function uploadAndSet(productId: string, field: "image1" | "videoUrl") {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = field === "videoUrl" ? "video/*" : "image/*";
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/media/upload", { method: "POST", body: form });
      if (!up.ok) return alert("Upload failed");
      const data = await up.json();
      await patchProduct(productId, { [field]: data.url } as Partial<Product>);
    };
    picker.click();
  }

  return (
    <main>
      <div className="topbar">
        <div className="container row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <strong>Acculekhaa Catalogue</strong>
          <div className="row">
            <button className="btn" onClick={() => setShowAdmin((x) => !x)}>{admin ? "Admin On" : "Admin Login"}</button>
            {admin ? <button className="btn" onClick={logoutAdmin}>Logout</button> : null}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "18px 0" }}>
        <div className="row" style={{ marginBottom: 14 }}>
          {["all", "software", "hardware", "iot", "service", "bundle"].map((c) => (
            <button key={c} className={`btn ${cat === c ? "primary" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {showAdmin && !admin ? (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="row">
              <input className="input" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn primary" onClick={loginAdmin}>Login</button>
            </div>
          </div>
        ) : null}

        <div className="row">
          {visible.map((p, i) => (
            <div key={`${p.id}-${p.slug}-${i}`} className="card" style={{ width: "min(360px, 100%)", flex: "1 1 320px" }}>
              <div className="muted" style={{ fontSize: 12 }}>{p.cat.toUpperCase()}</div>
              <h3 style={{ marginTop: 6, marginBottom: 6 }}>{p.name}</h3>
              <p className="muted" style={{ marginTop: 0 }}>{p.description}</p>
              <div style={{ fontWeight: 700 }}>₹{p.price.toLocaleString("en-IN")} / {p.unit}</div>
              {p.offer ? <div className="muted">Offer: {p.offer}</div> : null}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn primary" disabled={!p.inStock || !p.enabled} onClick={() => addToCart(p.id)}>Add</button>
                <button className="btn" onClick={() => createInquiry(p.id)}>Inquiry</button>
              </div>

              {admin ? (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div className="row">
                    <label><input type="checkbox" checked={p.enabled} onChange={(e) => patchProduct(p.id, { enabled: e.target.checked })} /> Enabled</label>
                    <label><input type="checkbox" checked={p.inStock} onChange={(e) => patchProduct(p.id, { inStock: e.target.checked })} /> In Stock</label>
                    <label><input type="checkbox" checked={Boolean(p.offer)} onChange={(e) => patchProduct(p.id, { offer: e.target.checked ? (p.offer || "SALE") : "" })} /> Sale</label>
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <input className="input" defaultValue={p.offer || ""} placeholder="Offer text" onBlur={(e) => patchProduct(p.id, { offer: e.target.value })} />
                    <input className="input" defaultValue={p.image1 || ""} placeholder="Image 1 URL" onBlur={(e) => patchProduct(p.id, { image1: e.target.value })} />
                    <input className="input" defaultValue={p.videoUrl || ""} placeholder="Video URL" onBlur={(e) => patchProduct(p.id, { videoUrl: e.target.value })} />
                    <button className="btn" onClick={() => uploadAndSet(p.id, "image1")}>Upload Image</button>
                    <button className="btn" onClick={() => uploadAndSet(p.id, "videoUrl")}>Upload Video</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="topbar" style={{ position: "fixed", bottom: 0, width: "100%", top: "auto" }}>
        <div className="container row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <strong>Cart Total: ₹{cartTotal.toLocaleString("en-IN")}</strong>
          <button className="btn primary" onClick={placeOrder}>Place Order</button>
        </div>
      </div>
    </main>
  );
}
