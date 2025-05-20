import psutil
import time
import os
import subprocess
import logging
from datetime import datetime, timedelta

# Configure logging to a plain text file (no encryption due to cryptography dependency failure)
logging.basicConfig(filename='guardian.log', level=logging.INFO, format='%(asctime)s - %(message)s')

# Directory for logs
LOG_DIR = "guardian_logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Store baseline data
device_usage = []  # [cpu_percent, memory_percent, timestamp]
network_connections = []  # [remote_ip, port, timestamp]
CPU_THRESHOLD = 80.0  # Alert if CPU usage exceeds 80%
MEMORY_THRESHOLD = 80.0  # Alert if memory usage exceeds 80%
SUSPICIOUS_PORTS = {23, 445}  # Example: Telnet, SMB (add more as needed)

# Save logs (plain text, as cryptography is unavailable)
def save_log(data):
    log_file = os.path.join(LOG_DIR, f"log_{int(time.time())}.log")
    with open(log_file, 'w') as f:
        f.write(json.dumps(data))
    logging.info(f"Log saved: {log_file}")

# Delete old logs (older than 24 hours)
def clean_old_logs():
    now = datetime.now()
    for log_file in os.listdir(LOG_DIR):
        file_path = os.path.join(LOG_DIR, log_file)
        file_time = datetime.fromtimestamp(os.path.getctime(file_path))
        if now - file_time > timedelta(hours=24):
            os.remove(file_path)
            logging.info(f"Deleted old log: {file_path}")

# Monitor device usage (CPU, memory)
def monitor_device_usage():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory().percent
    timestamp = time.time()
    device_usage.append([cpu, memory, timestamp])
    if cpu > CPU_THRESHOLD or memory > MEMORY_THRESHOLD:
        alert = {"type": "device_usage_anomaly", "cpu": cpu, "memory": memory, "timestamp": timestamp}
        save_log(alert)
        logging.warning(f"Device usage anomaly detected: CPU={cpu}%, Memory={memory}%")
    if len(device_usage) > 100:
        device_usage.pop(0)

# Monitor network connections using netstat
def monitor_network():
    try:
        result = subprocess.run(['netstat', '-tunap'], capture_output=True, text=True)
        lines = result.stdout.splitlines()
        timestamp = time.time()
        for line in lines[2:]:  # Skip header
            parts = line.split()
            if len(parts) >= 6 and ':' in parts[4]:  # Check for remote address
                remote_addr = parts[4].rsplit(':', 1)
                if len(remote_addr) == 2:
                    ip, port = remote_addr
                    port = int(port)
                    if port in SUSPICIOUS_PORTS:
                        alert = {"type": "suspicious_connection", "ip": ip, "port": port, "timestamp": timestamp}
                        save_log(alert)
                        logging.warning(f"Suspicious connection detected: {ip}:{port}")
                    network_connections.append([ip, port, timestamp])
        if len(network_connections) > 100:
            network_connections.pop(0)
    except Exception as e:
        logging.error(f"Network monitoring error: {e}")

# Main function
def main():
    print("Starting AI Guardian (Device and Network Monitoring)...")
    while True:
        monitor_device_usage()
        monitor_network()
        clean_old_logs()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()
