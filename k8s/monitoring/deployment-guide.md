# VirtualFit Monitoring Stack Deployment Guide

## Overview
This monitoring stack provides comprehensive visibility into your VirtualFit application with Prometheus metrics collection and Grafana dashboards.

## Prerequisites
- Kubernetes cluster with kubectl access
- KEDA installed (for autoscaling metrics)
- GPU nodes with NVIDIA device plugin (for GPU metrics)

## Deployment Steps

### 1. Deploy Monitoring Namespace and Prometheus
```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
```

This creates:
- `monitoring` namespace
- Prometheus server with persistent storage
- ServiceAccount and RBAC permissions
- Prometheus configuration for automatic pod discovery

### 2. Deploy Grafana
```bash
kubectl apply -f k8s/monitoring/grafana.yaml
```

This creates:
- Grafana server with persistent storage
- Pre-configured Prometheus datasource
- Admin credentials (default: admin/VirtualFit2024!)

### 3. Import VirtualFit Dashboard
```bash
kubectl apply -f k8s/monitoring/virtualfit-dashboard.yaml
```

This creates a ConfigMap with the pre-built VirtualFit performance dashboard.

### 4. Update Application Deployment
Ensure your inference service has Prometheus annotations:
```bash
kubectl apply -f virtualfit-enterprise-merged-with-tryon/deployments/k8s/inference-service.yaml
```

## Accessing the Dashboards

### Grafana
```bash
# Get the Grafana service endpoint
kubectl get svc grafana -n monitoring

# For local access via port-forward
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Access Grafana at: http://localhost:3000
- Username: `admin`
- Password: `VirtualFit2024!`

### Prometheus
```bash
# For direct Prometheus access
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

Access Prometheus at: http://localhost:9090

## Metrics Collected

### Application Metrics
- `virtualfit_requests_total` - Total number of requests by endpoint and status
- `virtualfit_request_duration_seconds` - Request latency histogram
- `virtualfit_queue_length` - Current processing queue length
- `virtualfit_active_requests` - Number of concurrent requests
- `virtualfit_gpu_memory_used_bytes` - GPU memory usage
- `virtualfit_gpu_utilization` - GPU utilization percentage

### Kubernetes Metrics
- CPU usage per pod
- Memory usage per pod
- Pod count and status
- Node resource utilization

### KEDA Metrics
- Active scaler status
- Scaling events
- Queue depth metrics

## Dashboard Panels

The VirtualFit Performance Dashboard includes:

1. **CPU Usage by Pod** - Real-time CPU consumption across all pods
2. **GPU Utilization** - GPU usage per device and pod
3. **Active Pods** - Current number of running pods (with autoscaling thresholds)
4. **Queue Length** - Processing queue depth
5. **P95 Latency** - 95th percentile request latency
6. **Request Rate** - Requests per second
7. **Memory Usage by Pod** - RAM consumption per pod
8. **GPU Memory Usage** - VRAM usage per GPU
9. **Request Status Codes** - HTTP status code distribution
10. **Request Latency Percentiles** - P50, P90, P95, P99 latency

## Alert Configuration (Optional)

To add alerting, create Prometheus alert rules:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yml: |
    groups:
    - name: virtualfit
      interval: 30s
      rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(virtualfit_request_duration_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
      - alert: HighErrorRate
        expr: rate(virtualfit_requests_total{status_code="500"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

## Troubleshooting

### Prometheus not scraping pods
- Verify pod annotations are present: `kubectl describe pod <pod-name> -n virtualfit`
- Check Prometheus targets: Visit Prometheus UI → Status → Targets

### No GPU metrics
- Ensure NVIDIA device plugin is installed: `kubectl get ds -n kube-system nvidia-device-plugin-daemonset`
- Verify GPU access in pods: `kubectl exec <pod-name> -n virtualfit -- nvidia-smi`

### Grafana dashboard not loading
- Verify ConfigMap is mounted: `kubectl exec <grafana-pod> -n monitoring -- ls /var/lib/grafana/dashboards`
- Check Grafana logs: `kubectl logs -n monitoring deployment/grafana`

## Customization

### Modify retention period
Edit `prometheus.yaml` and change:
```yaml
- '--storage.tsdb.retention.time=30d'  # Change to desired retention
```

### Add custom metrics
Add to `viton_hd_api.py`:
```python
CUSTOM_METRIC = Counter('virtualfit_custom_metric', 'Description')
CUSTOM_METRIC.inc()
```

### Adjust scrape intervals
Edit `prometheus.yaml` ConfigMap:
```yaml
global:
  scrape_interval: 15s  # Change to desired interval
```

## Security Notes

- Default Grafana password should be changed in production
- Consider enabling TLS for Grafana and Prometheus
- Restrict access using NetworkPolicies
- Use Secrets for sensitive credentials instead of ConfigMaps

## Resource Requirements

### Prometheus
- CPU: 500m request, 2000m limit
- Memory: 1Gi request, 4Gi limit
- Storage: 50Gi persistent volume

### Grafana
- CPU: 250m request, 1000m limit
- Memory: 512Mi request, 2Gi limit
- Storage: 10Gi persistent volume
