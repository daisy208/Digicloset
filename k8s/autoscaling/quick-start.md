# Quick Start: GPU Auto-Scaling

## Fast Track Deployment

### 1. Prerequisites
- Kubernetes cluster with GPU nodes
- kubectl and helm installed
- Monitoring stack deployed (Prometheus + Grafana)

### 2. One-Command Installation
```bash
cd k8s/autoscaling
chmod +x install.sh
./install.sh
```

The script will:
- Install KEDA
- Install NVIDIA GPU Operator
- Deploy DCGM Exporter for GPU metrics
- Deploy KEDA ScaledObject with GPU triggers
- Optionally deploy Prometheus Adapter

### 3. Manual Installation (Alternative)

#### Install KEDA
```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

#### Install GPU Operator
```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm install --generate-name -n gpu-operator --create-namespace nvidia/gpu-operator
```

#### Deploy Components
```bash
kubectl apply -f k8s/autoscaling/nvidia-gpu-operator.yaml
kubectl apply -f k8s/monitoring/prometheus.yaml  # Updated with GPU scraping
kubectl apply -f k8s/autoscaling/keda-gpu-scaler.yaml
```

### 4. Verify It's Working

#### Check all components are running
```bash
kubectl get pods -n keda
kubectl get pods -n gpu-operator
kubectl get scaledobject -n virtualfit
kubectl get hpa -n virtualfit
```

#### Watch pods scale
```bash
kubectl get pods -n virtualfit -w
```

#### Check GPU metrics in Prometheus
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090 and query: DCGM_FI_DEV_GPU_UTIL
```

## Scaling Configuration Summary

Your inference service will now auto-scale based on:

| Trigger | Threshold | What It Monitors |
|---------|-----------|------------------|
| GPU Utilization | 70% | GPU compute usage |
| GPU Memory | 80% | GPU VRAM usage |
| Queue Length | 10 requests | Pending requests |
| Active Requests | 5 per pod | Concurrent processing |
| P95 Latency | 5000ms | Response time |

**Scaling Limits:**
- Min: 1 replica
- Max: 10 replicas
- Scale-up: Aggressive (100% increase or +2 pods every 30s)
- Scale-down: Conservative (50% decrease every 60s, 5min cooldown)

## Testing

Generate load to trigger scaling:
```bash
kubectl run -it load-test --rm --image=curlimages/curl --restart=Never -- sh

# Inside the pod:
for i in {1..50}; do
  curl -X POST http://inference-service.virtualfit:8000/tryon \
    -F "person_image=@person.jpg" \
    -F "cloth_image=@cloth.jpg" &
done
```

Watch the magic happen:
```bash
# Terminal 1: Watch pods
kubectl get pods -n virtualfit -w

# Terminal 2: Watch HPA
kubectl get hpa -n virtualfit -w

# Terminal 3: Watch GPU metrics
kubectl top nodes
```

## Grafana Dashboard

View autoscaling metrics in Grafana:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Visit http://localhost:3000 (admin/VirtualFit2024!)

Look for:
- GPU Utilization panel
- Active Pods gauge
- Queue Length gauge
- Request Latency percentiles

## Troubleshooting

### Pods not scaling?
```bash
# Check KEDA logs
kubectl logs -n keda deployment/keda-operator -f

# Check ScaledObject status
kubectl describe scaledobject virtualfit-inference-gpu-scaler -n virtualfit

# Check if metrics are available
kubectl get --raw "/apis/external.metrics.k8s.io/v1beta1/namespaces/virtualfit/gpu_utilization"
```

### No GPU metrics?
```bash
# Check DCGM Exporter
kubectl logs -n gpu-operator daemonset/nvidia-dcgm-exporter

# Test GPU access
kubectl exec -n virtualfit <pod-name> -- nvidia-smi

# Verify nodes have GPU label
kubectl get nodes -L nvidia.com/gpu
```

### Scale events
```bash
kubectl get events -n virtualfit --sort-by='.lastTimestamp' | grep -i scale
```

## Cost Optimization

After deployment, consider:

1. **Adjust thresholds** based on actual usage patterns
2. **Enable cluster autoscaler** to add/remove GPU nodes
3. **Use spot instances** for non-production environments
4. **Set up scheduled scaling** for predictable traffic patterns
5. **Monitor costs** with cloud provider dashboards

## Next Steps

For detailed configuration options, see:
- `gpu-autoscaling-guide.md` - Complete guide
- `keda-gpu-scaler.yaml` - Scaling configuration
- `nvidia-gpu-operator.yaml` - GPU metrics setup

For help: Check the troubleshooting section in `gpu-autoscaling-guide.md`
