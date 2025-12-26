import { Resend } from 'resend';

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// 🟢 Dual Sender Identities
const OFFICIAL_SENDER = 'SeaBite Official <official@seabite.co.in>';
const ORDERS_SENDER = 'SeaBite Orders <orders@seabite.co.in>';

/**
 * 🟢 1. AUTH: LUXURY WELCOME EXPERIENCE
 * Design: Premium glassmorphism + ocean gradient animations
 */
export const sendAuthEmail = async (email, name, isNewUser = false) => {
  const istTime = new Date().toLocaleString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    dateStyle: "medium", 
    timeStyle: "short" 
  });
  
  const title = isNewUser ? "Welcome to the Family" : "Welcome Back";
  const headerText = isNewUser 
    ? `Welcome to SeaBite, ${name}! 🌊` 
    : `Welcome Back, ${name}! 👋`;

  const bodyContent = isNewUser 
    ? `<p>We're thrilled to have you on board. Your journey to the freshest catch in India starts today. Explore our menu and experience the ocean's best delivered to your doorstep.</p>`
    : `<p>A new login was detected for your SeaBite account at <b>${istTime} IST</b>. We send these notifications to help keep your account secure.</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #0c0c1a 0%, #1a1a2e 50%, #16213e 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05); }
        .header { background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%); padding: 50px 40px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); } 100% { transform: translateX(100%) translateY(100%) rotate(45deg); } }
        .logo { width: 160px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); }
        .title-badge { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 8px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; letter-spacing: 2px; color: white; border: 1px solid rgba(255,255,255,0.3); margin-top: 20px; }
        .content { padding: 60px 50px; text-align: center; }
        .hero-text { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; line-height: 1.2; }
        .body-text { font-size: 18px; color: #475569; line-height: 1.7; max-width: 500px; margin: 0 auto 40px; }
        .security-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid rgba(245,158,11,0.2); border-radius: 20px; padding: 30px; margin: 40px 0; backdrop-filter: blur(10px); }
        .security-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; font-size: 15px; }
        .label { color: #92400e; font-weight: 500; }
        .value { font-weight: 600; color: #7c2d12; }
        .cta-button { background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); color: white; padding: 20px 50px; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 17px; display: inline-block; box-shadow: 0 12px 30px rgba(56,189,248,0.4); transition: all 0.3s ease; border: none; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(56,189,248,0.5); }
        .wave-divider { height: 4px; background: linear-gradient(90deg, transparent 0%, #38bdf8 50%, transparent 100%); margin: 50px 0; border-radius: 2px; }
        @media (max-width: 600px) { .content { padding: 40px 30px; } .hero-text { font-size: 26px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://seabite.co.in/logo.png" class="logo" alt="SeaBite">
          <div class="title-badge">${title}</div>
        </div>
        <div class="content">
          <h1 class="hero-text">${headerText}</h1>
          <div class="body-text">${bodyContent}</div>
          
          ${!isNewUser ? `
          <div class="security-card">
            <div class="security-grid">
              <div class="label">Login Time</div>
              <div class="value">${istTime} IST</div>
              <div class="label">Method</div>
              <div class="value">Google Secure Login</div>
            </div>
          </div>` : ''}
          
          <div class="wave-divider"></div>
          <a href="https://seabite.co.in" class="cta-button">🌊 Browse Fresh Catch</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: OFFICIAL_SENDER,
    to: email,
    subject: isNewUser ? 'Welcome to SeaBite! 🌊' : 'Security Alert: New Login to SeaBite',
    html
  });
};

/**
 * 🟢 2. ORDERS: PREMIUM RECEIPT EXPERIENCE
 * Design: Luxury neumorphism + dynamic pricing highlights
 */
export const sendOrderPlacedEmail = async (email, name, orderId, total, items, paymentMethod) => {
  const isCOD = paymentMethod === "COD";
  const paymentLabel = isCOD ? "Total (Pay on Delivery)" : "Total Paid";
  const labelColor = isCOD ? "#f59e0b" : "#10b981";

  const itemRows = items.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
      <div>
        <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 14px; color: #64748b;">Qty: ${item.qty}</div>
      </div>
      <div style="font-size: 18px; font-weight: 700; color: #1e293b;">₹${(item.price * item.qty).toLocaleString()}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: radial-gradient(ellipse at top, #667eea 0%, #764ba2 100%); padding: 30px 10px; min-height: 100vh; }
        .container { max-width: 650px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 28px; overflow: hidden; box-shadow: 0 35px 80px rgba(0,0,0,0.2); backdrop-filter: blur(20px); }
        .hero-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); color: white; padding: 60px 40px; position: relative; }
        .hero-header::after { content: '✓'; position: absolute; font-size: 80px; opacity: 0.1; top: 20px; right: 30px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .logo-white { width: 120px; filter: brightness(0) invert(1); }
        .status-badge { background: rgba(255,255,255,0.2); padding: 10px 24px; border-radius: 25px; font-weight: 600; backdrop-filter: blur(10px); }
        .hero-title { font-size: 28px; font-weight: 700; margin: 20px 0 10px; }
        .greeting { font-size: 18px; opacity: 0.95; }
        .order-info { padding: 50px 40px; }
        .order-meta { display: flex; gap: 20px; margin-bottom: 40px; font-size: 14px; color: #64748b; }
        .items-section { background: rgba(248,250,252,0.7); border-radius: 20px; padding: 30px; margin-bottom: 40px; border: 1px solid rgba(148,163,184,0.1); }
        .section-title { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 25px; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 30px 0; border-top: 3px solid ${labelColor}; margin-top: 20px; }
        .total-label { font-size: 18px; font-weight: 600; color: #374151; }
        .total-amount { font-size: 32px; font-weight: 800; color: ${labelColor}; }
        .delivery-card { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 20px; padding: 30px; text-align: center; border: 1px solid rgba(34,197,94,0.3); }
        .delivery-icon { font-size: 48px; margin-bottom: 15px; }
        .cta-section { padding: 0 40px 50px; text-align: center; }
        .cta-button { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 22px 60px; text-decoration: none; border-radius: 20px; font-weight: 600; font-size: 18px; display: inline-block; box-shadow: 0 20px 40px rgba(16,185,129,0.3); }
        @media (max-width: 600px) { .order-info { padding: 30px 25px; } .hero-header { padding: 40px 25px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="hero-header">
          <div class="header-flex">
            <img src="https://seabite.co.in/logo.png" class="logo-white" alt="SeaBite">
            <div class="status-badge">Order Confirmed</div>
          </div>
          <h1 class="hero-title">Order #${orderId} is on the way!</h1>
          <p class="greeting">Thank you for choosing SeaBite, ${name}!</p>
        </div>
        
        <div class="order-info">
          <div class="order-meta">
            <div><strong>Order ID:</strong> #${orderId}</div>
            <div><strong>Status:</strong> Preparing</div>
          </div>
          
          <div class="items-section">
            <div class="section-title">📦 Your Fresh Catch</div>
            ${itemRows}
            <div class="total-row">
              <div class="total-label">${paymentLabel}</div>
              <div class="total-amount">₹${total.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="delivery-card">
            <div class="delivery-icon">🚚</div>
            <div style="font-size: 20px; font-weight: 700; color: #166534; margin-bottom: 8px;">Estimated Delivery</div>
            <div style="font-size: 28px; font-weight: 800; color: #15803d;">2 - 3 Days</div>
          </div>
        </div>
        
        <div class="cta-section">
          <a href="https://seabite.co.in/profile" class="cta-button">Track My Order</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Order Confirmed: #${orderId}`,
    html
  });
};

/**
 * 🟢 3. STATUS: PROGRESSIVE JOURNEY TRACKER
 * Design: Interactive progress timeline with glassmorphism
 */
export const sendStatusUpdateEmail = async (email, name, orderId, status) => {
  const isDelivered = status === 'Delivered';
  const isShipped = status === 'Shipped' || status === 'Out for Delivery';
  const isCancelled = status.toLowerCase().includes('cancel');
  
  const accentColor = isCancelled ? '#ef4444' : (isDelivered ? '#22c55e' : '#3b82f6');
  const headerBg = isCancelled ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                  (isDelivered ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 
                  (isShipped ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
                  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'));
  
  const statusIcon = isDelivered ? '🎁' : (isCancelled ? '🛑' : (isShipped ? '✈️' : '🚚'));
  const statusLabel = isDelivered ? 'Delivered!' : (isCancelled ? 'Cancelled' : status);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 10px; min-height: 100vh; }
        .container { max-width: 620px; margin: 0 auto; background: rgba(255,255,255,0.92); backdrop-filter: blur(25px); border-radius: 28px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.3); }
        .status-header { ${headerBg}; color: white; padding: 70px 40px; text-align: center; position: relative; }
        .status-icon { font-size: 72px; margin-bottom: 20px; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.3)); }
        .status-title { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
        .status-subtitle { font-size: 18px; opacity: 0.95; }
        .progress-container { padding: 60px 50px; }
        .greeting { font-size: 20px; color: #1e293b; margin-bottom: 50px; text-align: center; font-weight: 500; }
        .progress-timeline { position: relative; margin: 60px 0; }
        .timeline-line { position: absolute; left: 20px; top: 0; bottom: 0; width: 4px; background: linear-gradient(to bottom, ${accentColor}, transparent); border-radius: 2px; }
        .timeline-steps { display: flex; flex-direction: column; gap: 50px; }
        .step { display: flex; align-items: center; position: relative; }
        .step-number { width: 44px; height: 44px; border-radius: 50%; background: ${accentColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px ${accentColor.replace('rgb', 'rgba').replace(')', ',0.4)')}; z-index: 2; }
        .step-content { margin-left: 30px; flex: 1; }
        .step-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
        .step-time { font-size: 14px; color: #64748b; }
        .current-status { background: linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}44 100%); border-radius: 20px; padding: 35px; margin: 60px 0; border: 1px solid ${accentColor}55; text-align: center; }
        .status-badge { display: inline-block; background: ${accentColor}; color: white; padding: 12px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px ${accentColor.replace('rgb', 'rgba').replace(')', ',0.4)')}; }
        .cta-container { padding: 0 50px 70px; text-align: center; }
        .cta-button { background: rgba(255,255,255,0.9); color: ${accentColor}; padding: 22px 60px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 2px solid ${accentColor}33; backdrop-filter: blur(10px); }
        .cta-button:hover { background: white; transform: translateY(-3px); box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        @media (max-width: 600px) { .progress-container { padding: 40px 30px; } .timeline-steps { gap: 40px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-header">
          <div class="status-icon">${statusIcon}</div>
          <h1 class="status-title">${statusLabel}</h1>
          <p class="status-subtitle">Order #${orderId}</p>
        </div>
        
        <div class="progress-container">
          <div class="greeting">Hi ${name}, here's the latest update on your order!</div>
          
          <div class="progress-timeline">
            <div class="timeline-line"></div>
            <div class="timeline-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <div class="step-title">Order Placed</div>
                  <div class="step-time">Completed</div>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <div class="step-title">In Transit</div>
                  <div class="step-time">${isShipped || isDelivered ? 'Completed' : 'In Progress'}</div>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <div class="step-title">Delivered</div>
                  <div class="step-time">${isDelivered ? 'Completed' : 'Pending'}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${!isCancelled ? '' : `
          <div class="current-status">
            <div style="font-size: 16px; color: #7c2d12; margin-bottom: 20px; font-weight: 500;">Reason: Customer Request</div>
            <div class="status-badge">Refund Initiated</div>
          </div>
          `}
          
          <div class="cta-container">
            <a href="https://seabite.co.in/profile" class="cta-button">Track Full Journey</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: ORDERS_SENDER,
    to: email,
    subject: `SeaBite Update: Order #${orderId} is ${status}`,
    html
  });
};
