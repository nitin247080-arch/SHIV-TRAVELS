# 🌐 SHIV TRAVELS - Custom Domain & Cloud Deployment Guide
## Deploying to `https://shivtravels.com` for Global Multi-Device Access

> **B.Tech Computer Science & Engineering | Semester 3**  
> **Platform:** SHIV TRAVELS — Online Travel Booking Platform  
> **Target Production URL:** `https://shivtravels.com`  

---

## 📑 विषय-सूची (Table of Contents)
1. [Custom Domain आर्किटेक्चर कैसे कार्य करता है?](#1-custom-domain-आर्किटेक्चर-कैसे-कार्य-करता-है)
2. [विकल्प 1: तुरंत अपने लैपटॉप/PC पर `shivtravels.com` चलाना (Local Domain Presentation)](#विकल्प-1-तुरंत-अपने-लैपटॉपpc-पर-shivtravelscom-चलाना-local-domain-presentation)
3. [विकल्प 2: कॉलेज वाइवा एवं टीचर्स के लिए लाइव पब्लिक HTTPS लिंक (Zero-Cost Instant Sharing)](#विकल्प-2-कॉलेज-वाइवा-एवं-टीचर्स-के-लिए-लाइव-पब्लिक-https-लिंक-zero-cost-instant-sharing)
4. [विकल्प 3: असली Custom Domain (`https://shivtravels.com`) को 24/7 Cloud पर Deploy करना](#विकल्प-3-असली-custom-domain-httpsshivtravelscom-को-247-cloud-पर-deploy-करना)
   - [Step 3.1: Domain Registration (GoDaddy / Namecheap / Cloudflare)](#step-31-domain-registration-godaddy--namecheap--cloudflare)
   - [Step 3.2: Free Cloud Hosting पर Deploy करना (Render.com / Docker)](#step-32-free-cloud-hosting-पर-deploy-करना-rendercom--docker)
   - [Step 3.3: DNS Configuration Table (CNAME / A Records)](#step-33-dns-configuration-table-cname--a-records)
   - [Step 3.4: Free SSL / HTTPS Certificate](#step-34-free-ssl--https-certificate)
5. [विकल्प 4: Cloudflare Tunnel के माध्यम से लाइव Custom Domain जोड़ना](#विकल्प-4-cloudflare-tunnel-के-माध्यम-से-लाइव-custom-domain-जोड़ना)
6. [परीक्षण एवं मोबाइल डिवाइस सत्यापन (Verification Checklist)](#6-परीक्षण-एवं-मोबाइल-डिवाइस-सत्यापन-verification-checklist)

---

## 1. Custom Domain आर्किटेक्चर कैसे कार्य करता है?

जब कोई भी शिक्षक (Teacher) या छात्र (Student) अपने फ़ोन या लैपटॉप पर `https://shivtravels.com` खोलता है, तो बैकग्राउंड में 4 मुख्य तकनीकें कार्य करती हैं:

```
[ यूजर का मोबाइल / लैपटॉप ]
           │
           ▼ (HTTPS Request: shivtravels.com)
┌──────────────────────────────────────────────┐
│  1. DNS Resolver (Cloudflare / GoDaddy)     │
│     shivtravels.com ➔ Server IP Address      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  2. SSL/TLS Certificate (Let's Encrypt)     │
│     Secure Padlock (https://) Handshake      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  3. Cloud Hosting Server (Docker / Render)   │
│     Standard Port 80 (HTTP) & 443 (HTTPS)   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  4. SHIV TRAVELS Java Backend Engine (Java 17)│
│     REST APIs (/api/*) + Web UI (HTML/CSS/JS)│
└──────────────────────────────────────────────┘
```

---

## विकल्प 1: तुरंत अपने लैपटॉप/PC पर `shivtravels.com` चलाना (Local Domain Presentation)

यदि आपको कॉलेज लैब या परीक्षक (Examiner) के सामने स्क्रीन पर सीधे **`http://shivtravels.com`** खोलकर दिखाना है:

### स्टेप्स:
1. प्रोजेक्ट फोल्डर में मौजूद **`setup-local-domain.bat`** पर राइट-क्लिक करें और **"Run as administrator"** चुनें।
   - यह स्क्रिप्ट Windows की `C:\Windows\System32\drivers\etc\hosts` फ़ाइल में स्वचालित रूप से `127.0.0.1 shivtravels.com` और `www.shivtravels.com` जोड़ देगी।
2. अब **`run-domain-port80.bat`** पर डबल-क्लिक करें।
   - यह SHIV TRAVELS को स्टैंडर्ड पोर्ट `80` पर शुरू कर देगा।
3. Google Chrome या Microsoft Edge खोलें और सीधे टाइप करें:
   ```
   http://shivtravels.com
   ```
   बिना किसी पोर्ट नंबर के वेबसाइट सीधे आपके कस्टम डोमेन पर खुल जाएगी!

---

## विकल्प 2: कॉलेज वाइवा एवं टीचर्स के लिए लाइव पब्लिक HTTPS लिंक (Zero-Cost Instant Sharing)

यदि परीक्षक या शिक्षक अपने **स्वयं के मोबाइल फोन (Android/iPhone)** या किसी अन्य कंप्यूटर से वेबसाइट खोलना चाहते हैं:

### तरीका A: 1-Click Instant Global Public HTTPS Link
1. सुनिश्चित करें कि SHIV TRAVELS चल रहा है (`run.bat` - Port 8181)।
2. प्रोजेक्ट फोल्डर में मौजूद **`share-public-url.bat`** पर डबल-क्लिक करें।
3. यह स्क्रिप्ट Node.js LocalTunnel का उपयोग करके एक सुरक्षित लाइव HTTPS लिंक जनरेट करेगी:
   ```
   https://shivtravels.loca.lt
   ```
4. यह लिंक WhatsApp या ईमेल के ज़रिए टीचर को भेजें। वे दुनिया के किसी भी इंटरनेट कनेक्शन (4G, 5G, Wi-Fi) से अपने मोबाइल में इसे खोलकर पूरा प्रोजेक्ट लाइव देख सकते हैं!

### तरीका B: कॉलेज के एक ही Wi-Fi / Hotspot पर मोबाइल से खोलना
1. अपने लैपटॉप का मोबाइल हॉटस्पॉट चालू करें या कॉलेज वाई-फाई से कनेक्ट करें।
2. `share-public-url.bat` चलाने पर आपको आपका लोकल नेटवर्क IP दिखाई देगा (जैसे `http://192.168.1.35:8181`)।
3. शिक्षक अपने मोबाइल ब्राउज़र में सीधे यह IP डालकर वेबसाइट खोल सकते हैं।

---

## विकल्प 3: असली Custom Domain (`https://shivtravels.com`) को 24/7 Cloud पर Deploy करना

इंटरनेट पर स्थायी रूप से **`https://shivtravels.com`** चलाने के लिए नीचे दिए गए 4 सरल चरणों का पालन करें:

### Step 3.1: Domain Registration
1. किसी भी डोमेन रजिस्ट्रार (जैसे **Namecheap.com**, **GoDaddy.com**, या **Cloudflare Registrar**) पर जाएँ।
2. `shivtravels.com` (या कोई भी पसंदीदा डोमेन जैसे `shivtravels-official.com`) सर्च करके रजिस्टर करें।

### Step 3.2: Free Cloud Hosting पर Deploy करना (Render.com)
प्रोजेक्ट में पहले से ही प्रोडक्शन-ग्रेड **`Dockerfile`** और **`render.yaml`** तैयार कर दी गई है।
1. इस प्रोजेक्ट को अपने **GitHub** खाते में पुश करें:
   ```bash
   git init
   git add .
   git commit -m "SHIV TRAVELS Production Release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/shiv-travels.git
   git push -u origin main
   ```
2. **[Render.com](https://render.com)** पर फ्री खाता बनाएँ।
3. **New + ➔ Web Service** पर क्लिक करें और अपनी GitHub रिपॉजिटरी चुनें।
4. **Environment**: `Docker` चुनें।
5. **Plan**: `Free` चुनें।
6. **Create Web Service** पर क्लिक करें। 
   - Render स्वचालित रूप से Docker इमेज बिल्ड करेगा और आपको एक फ्री URL देगा (जैसे `https://shiv-travels.onrender.com`)।

### Step 3.3: DNS Configuration Table (Custom Domain जोड़ना)
Render डैशबोर्ड में **Settings ➔ Custom Domains** में जाएँ और `shivtravels.com` और `www.shivtravels.com` दर्ज करें।

इसके बाद अपने Domain Registrar (GoDaddy/Namecheap/Cloudflare) के **DNS Manager** में निम्न रिकॉर्ड जोड़ें:

| Type | Name / Host | Target / Value | TTL | Proxy Status |
|:---|:---|:---|:---|:---|
| **CNAME** | `@` (Root) | `shiv-travels.onrender.com` | Auto | DNS Only / Proxied |
| **CNAME** | `www` | `shiv-travels.onrender.com` | Auto | DNS Only / Proxied |

*(यदि आपका रजिस्ट्रार रूट `@` पर CNAME की अनुमति नहीं देता है, तो Render द्वारा दिया गया **A Record** (IP Address) दर्ज करें)*

### Step 3.4: Free SSL / HTTPS Certificate
- Render और Cloudflare दोनों स्वचालित रूप से **Let's Encrypt Free SSL Certificate** जारी करते हैं।
- DNS अपडेट होने के 5 से 10 मिनट के भीतर **`https://shivtravels.com`** के आगे ग्रीन पैडलॉक (🔒 Secure Connection) सक्रिय हो जाएगा।

---

## विकल्प 4: Cloudflare Tunnel के माध्यम से लाइव Custom Domain जोड़ना (Zero Cloud Cost)

यदि आपके पास `shivtravels.com` डोमेन Cloudflare पर है और आप अपने ही लैपटॉप से बिना किसी VPS या रेंट के लाइव HTTPS सर्व करना चाहते हैं:

1. **Cloudflared CLI** डाउनलोड करें:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Cloudflare में लॉगिन करें:
   ```powershell
   cloudflared tunnel login
   ```
3. टनल बनाएँ और डोमेन रूट करें:
   ```powershell
   cloudflared tunnel create shivtravels-tunnel
   cloudflared tunnel route dns shivtravels-tunnel shivtravels.com
   cloudflared tunnel run --url http://localhost:8181 shivtravels-tunnel
   ```
4. अब दुनिया भर से कोई भी व्यक्ति जब `https://shivtravels.com` खोलेगा, तो Cloudflare सुरक्षित रूप से आपके लैपटॉप के SHIV TRAVELS सर्वर से कनेक्ट हो जाएगा!

---

## 6. परीक्षण एवं मोबाइल डिवाइस सत्यापन (Verification Checklist)

| जाँच बिंदु (Checklist) | अपेक्षित परिणाम (Expected Result) | स्थिति |
|:---|:---|:---:|
| **Local Custom Domain** | `http://shivtravels.com` ब्राउज़र में सीधे खुलता है | ✅ Ready |
| **Port 80 Binding** | बिना पोर्ट नंबर लिखे डिफ़ॉल्ट पोर्ट पर लोड होता है | ✅ Ready |
| **Mobile Live URL** | `share-public-url.bat` से फोन पर लाइव लिंक खुलता है | ✅ Ready |
| **Docker Build** | `Dockerfile` से लाइटवेट अल्पाइन कंटेनर तैयार होता है | ✅ Ready |
| **Database Sync** | MySQL के साथ लाइव डेटा और सेटिंग्स सिंक होती हैं | ✅ Ready |
| **Role Switcher & Auth** | Admin, Agent और Traveler सभी रोल्स स्मूदली कार्य करते हैं | ✅ Ready |
