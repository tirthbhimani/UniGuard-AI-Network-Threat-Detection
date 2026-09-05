# 🛡️ UniGuard

### AI-Powered Passive Network Threat Detection & Analysis Platform

UniGuard is a cybersecurity platform designed to passively analyze network traffic and detect suspicious cyberattack patterns using a combination of **explainable rule-based detection** and **unsupervised Machine Learning**.

UniGuard supports two analysis modes:

- 🔴 **Live Monitor** — passively observes traffic from a selected network interface in real time.
- 🔵 **PCAP / Forensic Analysis** — analyzes uploaded `.pcap` files for deeper investigation and threat detection.

The goal is simple:

> **Turn raw network traffic into understandable, evidence-based cybersecurity intelligence.**

---

## 🎯 Key Features

### 🔴 Live Passive Network Monitoring

- Select an available network interface
- Start and stop live monitoring
- Monitor real network traffic
- Live packet statistics
- Traffic volume monitoring
- Active flow information
- Real-time threat alerts
- Passive / read-only monitoring architecture

UniGuard observes traffic without actively probing or sending commands to monitored devices.

---

### 🔵 PCAP / Forensic Analysis

Upload a `.pcap` capture file and perform deeper analysis.

The system:

1. Parses packets
2. Extracts network features
3. Groups traffic by source
4. Runs threat detection
5. Runs ML anomaly detection
6. Generates evidence-based alerts
7. Displays investigation results

---

## 🚨 Current Threat Detection

The current MVP detects three major traffic patterns:

### 1. Port Scanning

Detects a source contacting an unusually large number of distinct destination ports within a short period.

Example evidence:

```text
Source contacted 30 distinct destination ports
Activity occurred within 55 seconds
2. DDoS / Abnormal Traffic Volume

Detects unusually high packet rates and abnormal traffic volume from a source.

The current MVP focuses primarily on single-source flood behavior.

3. Suspicious Data Exfiltration

Detects suspiciously large amounts of data transferred by a source, particularly when traffic is concentrated toward a small number of destinations.

🧠 Detection Approach

UniGuard uses two complementary detection methods.

Rule-Based Detection

Rule-based detection uses explainable thresholds and traffic characteristics.

For example:

IF a source contacts an unusually high number of ports
THEN flag potential Port Scanning

Advantages:

Fast
Explainable
Easy to validate
Provides concrete evidence for alerts
🤖 AI Anomaly Detection

UniGuard also uses an unsupervised Isolation Forest model.

Instead of relying only on predefined thresholds, the model analyzes traffic behavior and identifies sources that appear statistically unusual within the analyzed traffic.

This provides a second layer of detection for behavior that may not match a predefined rule.

🔍 Detection Pipeline
Network Traffic / PCAP
          │
          ▼
     Packet Parsing
          │
          ▼
    Feature Extraction
          │
          ▼
   ┌──────┴───────┐
   │              │
   ▼              ▼
Rule-Based     Isolation
 Detection      Forest
   │              │
   └──────┬───────┘
          ▼
    Threat Analysis
          │
          ▼
 Risk & Confidence
          │
          ▼
 Evidence-Based Alert
          │
          ▼
   Security Dashboard
📊 Evidence-Based Alerts

Every generated alert provides useful investigation information such as:

Threat type
Severity
Confidence score
Source IP
Destination information
Timestamp
Supporting evidence

Example:

Threat: Port Scan

Severity: HIGH
Confidence: 80%

Source:
192.168.x.x

Evidence:
• Source contacted 30 distinct destination ports
• Activity occurred within 55 seconds

UniGuard prioritizes explainability instead of presenting unexplained black-box predictions.

🖥️ Dashboard

The web dashboard provides multiple views:

Overview
System status
Latest analysis summary
Traffic statistics
Threat summary
Risk level
Live Monitor
Network interface selection
Start / Stop monitoring
Live packet feed
Traffic statistics
Real-time alerts
PCAP / Forensic Analysis
PCAP upload
Packet analysis
Threat detection
ML anomaly detection
Investigation results
Threat Intelligence
Aggregated threat information
Results from analysis runs
Threat summaries
AI Detection
Isolation Forest analysis
Anomaly results
Detection information
🏗️ System Architecture
              ┌──────────────────────┐
              │   Network Interface  │
              └──────────┬───────────┘
                         │
                         ▼
                 Passive Capture
                         │
                         ▼
              ┌──────────────────────┐
              │   Python + Scapy     │
              │ Packet Parsing       │
              └──────────┬───────────┘
                         │
                         ▼
                 Feature Extraction
                         │
              ┌──────────┴───────────┐
              │                      │
              ▼                      ▼
      Rule-Based Engine       Isolation Forest
              │                      │
              └──────────┬───────────┘
                         ▼
                 Threat Analysis
                         │
                         ▼
                Risk / Confidence
                         │
                         ▼
                  FastAPI Backend
                         │
                         ▼
             React + TypeScript UI
                         │
                         ▼
                  UniGuard Dashboard
🧰 Technology Stack
Layer	Technology
Programming Language	Python
Packet Capture & Parsing	Scapy
Data Processing	Pandas
Machine Learning	Scikit-learn
ML Model	Isolation Forest
Backend API	FastAPI
Frontend	React + TypeScript
Styling	Tailwind CSS
Charts	Recharts
Frontend Routing	React Router
Data Storage	In-Memory Python Structures
📁 Project Structure
UniGuard/
│
├── backend/
│   └── app/
│       ├── services/
│       ├── detection/
│       ├── ...
│       └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── README.md
├── .gitignore
└── ...

The exact structure may vary depending on the current implementation.

⚙️ Installation
Prerequisites

Make sure the following are installed:

Python 3.10+
Node.js 18+
npm
Git
🐍 Backend Setup

Open a terminal:

cd backend

Create a virtual environment:

Windows
python -m venv venv

Activate it:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the backend:

uvicorn app.main:app --reload

The API should then be available locally.

⚛️ Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Open the local URL shown by Vite in your browser.

🔴 Live Monitoring
Start the backend.
Start the frontend.
Open Live Monitor.
Select an available network interface.
Click Start Monitoring.
UniGuard begins passively observing traffic.
Traffic statistics and alerts update on the dashboard.
Click Stop Monitoring to terminate capture.

Only monitor networks and devices you are authorized to analyze.

📁 PCAP Analysis
Open PCAP / Forensic Analysis.
Select a .pcap file.
Start analysis.
UniGuard parses the captured packets.
Traffic features are extracted.
Rule-based detection is performed.
Isolation Forest anomaly detection is performed.
Results are displayed in the dashboard.
🧪 Validation

The current MVP has been tested using real network attack traffic generated in a controlled environment.

The implemented detectors have been tested against:

Port scanning traffic
High-volume flood traffic
Large data transfer traffic

The rule-based detection and Isolation Forest anomaly detection were also tested against captured attack traffic.

⚠️ Current Limitations

UniGuard is currently an MVP/prototype and is not intended to replace a production IDS or SOC platform.

In-Memory Storage

Current results are stored in memory and may be lost when the backend restarts.

A production version can use a persistent database.

AI Confidence

The current AI anomaly score is relative to the analyzed traffic batch.

It should not be interpreted as a universal probability of malicious activity.

False Positives

Legitimate high-volume traffic may occasionally trigger detection rules.

A production implementation could incorporate additional context such as IP reputation and baseline learning.

DDoS Detection

The current DDoS detector primarily focuses on single-source flood behavior.

Distributed DDoS detection involving multiple sources is a future improvement.

Live vs Forensic Processing

Live monitoring and deeper PCAP/AI analysis are currently separate modes.

This is an intentional MVP architecture:

Live mode prioritizes real-time visibility.
PCAP mode prioritizes deeper analysis.
🚀 Future Roadmap

Planned improvements include:

Distributed DDoS detection
DNS tunneling detection
DGA detection
Botnet C2 behavior detection
Improved encrypted traffic analysis
Persistent database storage
Advanced behavioral baselines
IP reputation integration
More advanced ML models
Investigation timeline
Advanced threat correlation
Exportable security reports
🎯 Smart India Hackathon 2026

UniGuard is being developed as a prototype for:

Smart India Hackathon 2026

Problem Statement

AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

Organization

National Technical Research Organisation (NTRO)

Category

Software

Theme

Blockchain & Cybersecurity

🛡️ Responsible Use

UniGuard is intended for:

Authorized network monitoring
Cybersecurity research
Controlled security testing
Educational demonstrations
Forensic network analysis

Do not use UniGuard to monitor or analyze networks without proper authorization.

👥 Team

Team: UniGuard

Project: UniGuard

Built for Smart India Hackathon 2026.
