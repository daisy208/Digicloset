Monitoring folder: Prometheus + Grafana templates + anomaly detector script.

Files:
- prometheus.yml                 : sample scrape config for your services
- grafana_dashboard.json         : example dashboard JSON (import into Grafana)
- anomaly_detector.py            : simple anomaly detection using rolling z-score (Python)
- requirements.txt               : python deps for anomaly detector
