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
