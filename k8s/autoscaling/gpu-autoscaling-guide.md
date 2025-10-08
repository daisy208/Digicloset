# GPU Auto-Scaling Setup Guide for VirtualFit

## Overview
This guide sets up GPU-based autoscaling using KEDA (Kubernetes Event-Driven Autoscaling) with multiple triggers including GPU utilization, GPU memory, request queue length, and latency metrics.

## Architecture
- **NVIDIA DCGM Exporter**: Exposes GPU metrics from NVIDIA GPUs
- **KEDA**: Watches Prometheus metrics and scales deployments
- **Prometheus Adapter**: (Optional) Exposes custom metrics to Kubernetes HPA API
- **Multiple Triggers**: GPU utilization, GPU memory, queue depth, active requests, and latency

## Prerequisites

### 1. KEDA Installation
```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

### 2. NVIDIA GPU Operator (if not already installed)
```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update
helm install --wait --generate-name \
  -n gpu-operator --create-namespace \
  nvidia/gpu-operator
```

## Deployment Steps

### Step 1: Deploy NVIDIA DCGM Exporter
This exports GPU metrics to Prometheus.

```bash
kubectl apply -f k8s/autoscaling/nvidia-gpu-operator.yaml
```

**Verify GPU metrics are being collected:**
```bash
kubectl port-forward -n gpu-operator svc/nvidia-dcgm-exporter 9400:9400

# Check metrics (in another terminal)
curl http://localhost:9400/metrics | grep DCGM_FI_DEV_GPU_UTIL
```

### Step 2: Update Prometheus to Scrape GPU Metrics
Add DCGM exporter to Prometheus scrape config:

```bash
kubectl edit configmap prometheus-config -n monitoring
```

Add to `scrape_configs`:
```yaml
- job_name: 'nvidia-dcgm'
  kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
          - gpu-operator
  relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      action: keep
      regex: nvidia-dcgm-exporter
    - source_labels: [__meta_kubernetes_pod_ip]
      action: replace
      target_label: __address__
      replacement: $1:9400
```

Then reload Prometheus:
```bash
kubectl rollout restart deployment/prometheus -n monitoring
```

### Step 3: Deploy KEDA GPU Scaler
This creates the ScaledObject that watches GPU metrics and scales your inference service.

```bash
kubectl apply -f k8s/autoscaling/keda-gpu-scaler.yaml
```

**What this does:**
- Scales between 1-10 replicas
- Triggers scale-up when:
  - GPU utilization > 70%
  - GPU memory utilization > 80%
  - Queue length > 10 requests
  - Active requests > 5 per pod
  - P95 latency > 5 seconds
- Includes PodDisruptionBudget to maintain availability during scaling

### Step 4: (Optional) Deploy Prometheus Adapter
Only needed if you want to use native Kubernetes HPA instead of KEDA.

```bash
kubectl apply -f k8s/autoscaling/prometheus-adapter.yaml
```

### Step 5: Verify Autoscaling is Working

**Check KEDA ScaledObject status:**
```bash
kubectl get scaledobject -n virtualfit
kubectl describe scaledobject virtualfit-inference-gpu-scaler -n virtualfit
```

**Check HPA created by KEDA:**
```bash
kubectl get hpa -n virtualfit
kubectl describe hpa keda-hpa-virtualfit-inference-gpu-scaler -n virtualfit
```

**Watch pod scaling in action:**
```bash
kubectl get pods -n virtualfit -w
```

## Scaling Triggers Explained

### 1. GPU Utilization (70% threshold)
```yaml
query: avg(DCGM_FI_DEV_GPU_UTIL{namespace="virtualfit"})
```
Scales up when average GPU compute utilization exceeds 70%.

### 2. GPU Memory Utilization (80% threshold)
```yaml
query: avg(DCGM_FI_DEV_FB_USED{namespace="virtualfit"} / DCGM_FI_DEV_FB_FREE{namespace="virtualfit"} * 100)
```
Scales up when GPU memory (VRAM) usage exceeds 80%.

### 3. Request Queue Length (10 requests threshold)
```yaml
query: sum(virtualfit_queue_length{namespace="virtualfit"})
```
Scales up when pending requests exceed 10.

### 4. Active Requests (5 per pod threshold)
```yaml
query: sum(virtualfit_active_requests{namespace="virtualfit"})
```
Scales up when concurrent requests exceed 5.

### 5. P95 Latency (5 seconds threshold)
```yaml
query: histogram_quantile(0.95, rate(virtualfit_request_duration_seconds_bucket{namespace="virtualfit"}[2m])) * 1000
```
Scales up when 95th percentile latency exceeds 5000ms.

## Scaling Behavior

### Scale-Up Policy
- **Aggressive**: Adds up to 100% of current pods or 2 pods (whichever is higher) every 30 seconds
- **No stabilization**: Responds immediately to load spikes

### Scale-Down Policy
- **Conservative**: Reduces by max 50% of current pods every 60 seconds
- **5-minute stabilization**: Waits 300 seconds before scaling down
- **5-minute cooldown**: After scaling down, waits before scaling again

This prevents:
- Rapid scale-up/scale-down cycles (flapping)
- Premature scale-down when load is variable

## Monitoring Autoscaling

### View Scaling Events
```bash
kubectl get events -n virtualfit --sort-by='.lastTimestamp' | grep -i scale
```

### Check Current Metrics
```bash
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/virtualfit/pods/*/gpu_utilization | jq .
```

### View KEDA Logs
```bash
kubectl logs -n keda deployment/keda-operator -f
```

### Grafana Dashboard
The VirtualFit dashboard already includes panels showing:
- GPU utilization trends
- Pod count changes
- Queue length
- Request latency

Access at: http://localhost:3000 (after port-forwarding Grafana)

## Testing Autoscaling

### Load Test Script
Create a load test to verify autoscaling:

```bash
#!/bin/bash
# load-test.sh

ENDPOINT="http://inference-service.virtualfit.svc.cluster.local:8000/tryon"

for i in {1..100}; do
  curl -X POST "$ENDPOINT" \
    -F "person_image=@person.jpg" \
    -F "cloth_image=@cloth.jpg" &
done

wait
```

Run from inside cluster:
```bash
kubectl run load-test --rm -it --image=curlimages/curl --restart=Never -- sh
# Then upload the script and test images
```

### Expected Behavior
1. Initial state: 1 replica running
2. Load increases → GPU utilization rises
3. KEDA detects utilization > 70%
4. Pods scale up (2, 4, 6, 8, 10)
5. Load distributes across pods
6. GPU utilization per pod drops below 70%
7. Load stops → 5-minute cooldown
8. Pods scale down gradually

## Troubleshooting

### Pods Not Scaling Up

**Check KEDA is running:**
```bash
kubectl get pods -n keda
```

**Check ScaledObject status:**
```bash
kubectl describe scaledobject virtualfit-inference-gpu-scaler -n virtualfit
```

**Verify Prometheus is accessible:**
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://prometheus.monitoring.svc.cluster.local:9090/api/v1/query?query=DCGM_FI_DEV_GPU_UTIL
```

**Check KEDA metrics:**
```bash
kubectl logs -n keda deployment/keda-operator | grep virtualfit
```

### GPU Metrics Not Available

**Verify DCGM Exporter is running:**
```bash
kubectl get pods -n gpu-operator
kubectl logs -n gpu-operator daemonset/nvidia-dcgm-exporter
```

**Check GPU nodes are labeled:**
```bash
kubectl get nodes --show-labels | grep nvidia.com/gpu
```

**Manually test GPU metrics:**
```bash
kubectl exec -n virtualfit <inference-pod> -- nvidia-smi
```

### Scaling Too Aggressive/Conservative

Adjust thresholds in `keda-gpu-scaler.yaml`:

```yaml
triggers:
  - type: prometheus
    metadata:
      threshold: "80"  # Increase to scale less aggressively
```

Adjust scaling policies:
```yaml
scaleUp:
  policies:
  - type: Percent
    value: 50        # Reduce from 100% to scale slower
    periodSeconds: 60  # Increase to scale less frequently
```

## Cost Optimization

### Node Autoscaling
Enable cluster autoscaler to add/remove GPU nodes:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: ClusterAutoscaler
spec:
  resourceLimits:
    - type: nvidia.com/gpu
      min: 1
      max: 10
```

### Spot Instances
Use spot/preemptible GPU instances for cost savings:

```yaml
nodeSelector:
  cloud.google.com/gke-spot: "true"  # GKE
  # eks.amazonaws.com/capacityType: "SPOT"  # EKS
```

### Downscale to Zero (Advanced)
For dev/staging, scale to zero during off-hours:

```yaml
spec:
  minReplicaCount: 0  # Warning: Cold starts will be slower
```

## Advanced Configuration

### Multi-Region Scaling
Deploy to multiple regions with different ScaledObjects:

```yaml
metadata:
  name: virtualfit-inference-us-west
  namespace: virtualfit-us-west
```

### Custom GPU Metrics
Add application-specific GPU metrics:

```python
GPU_TEMPERATURE = Gauge('gpu_temperature_celsius', 'GPU temperature')
GPU_POWER_USAGE = Gauge('gpu_power_watts', 'GPU power consumption')

def update_gpu_metrics():
    for gpu_id in range(torch.cuda.device_count()):
        temp = torch.cuda.temperature(gpu_id)
        GPU_TEMPERATURE.labels(gpu=gpu_id).set(temp)
```

Then add to KEDA triggers:
```yaml
- type: prometheus
  metadata:
    query: avg(gpu_temperature_celsius{namespace="virtualfit"})
    threshold: "80"
```

### Schedule-Based Scaling
Scale up during peak hours:

```yaml
- type: cron
  metadata:
    timezone: America/Los_Angeles
    start: 0 8 * * *    # 8 AM
    end: 0 22 * * *      # 10 PM
    desiredReplicas: "5"
```

## Security Considerations

- DCGM Exporter requires `SYS_ADMIN` capability for GPU access
- Prometheus adapter needs cluster-wide read permissions
- Consider using Pod Security Policies/Standards
- Restrict access to metrics endpoints with NetworkPolicies

## Performance Tips

1. **Pre-pull images**: Use DaemonSet to cache inference images on GPU nodes
2. **GPU sharing**: Use MIG (Multi-Instance GPU) for better utilization
3. **Batch requests**: Process multiple try-ons in a single GPU call
4. **Model caching**: Keep models in GPU memory between requests

## Next Steps

1. Set up alerts for scaling events
2. Configure cost monitoring for GPU usage
3. Implement request prioritization/queuing
4. Add A/B testing for scaling policies
5. Set up capacity planning dashboards
