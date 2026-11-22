import os
import sys
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'apps'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.locations.search_engine import QazvinSearchEngine
from apps.locations.models import QazvinPlace

def run_benchmark():
    se = QazvinSearchEngine()
    print("=================================================================")
    print("  QAZVIN LOCATION SEARCH ENGINE — BENCHMARK & PERFORMANCE AUDIT  ")
    print("=================================================================")
    total_places = QazvinPlace.objects.filter(is_active=True).count()
    print(f"Total Active Verified Qazvin Places in Database: {total_places}")

    test_queries = [
        'استخر',
        'استخر رجایی',
        'استخر المپیک',
        'خیام',
        'خیابان خیام شمالی',
        'بلوار نوروزیان',
        'خیابان دانشگاه',
        'بیمارستان ولایت',
        'بیمارستان بوعلی',
        'سبزه میدان',
        'سرای سعدالسلطنه',
        'پمپ بنزین',
        'داروخانه شبانه روزی',
        'حکمت چهل',
        'شهرک کوثر',
        'شهرک مینودر',
        'بیماستان ولایت',  # Typo test
        'استخر ازادی',     # Arabic/Persian letter variation test
        'تهران',           # Outside city rejection test
        'کرج',             # Outside city rejection test
    ]

    # 1. Cold Queries Benchmark (Cache bypassed or first-run)
    cold_latencies = []
    print("\n--- 1. Cold Query Latencies (Initial Search & Database Querying) ---")
    for q in test_queries:
        t0 = time.perf_counter()
        res = se.search(q, user_coords={'lat': 36.2797, 'lng': 50.0049})
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        cold_latencies.append(elapsed_ms)
        status_info = "REJECTED (Outside)" if res.get('is_outside_scope') else f"{res.get('total_count')} results"
        print(f"  Query: '{q:<20}' -> {elapsed_ms:6.2f} ms | Status: {status_info}")

    cold_p50 = statistics.median(cold_latencies)
    cold_p95 = statistics.quantiles(cold_latencies, n=20)[18] if len(cold_latencies) >= 20 else max(cold_latencies)

    # 2. Warm / Cached Queries Benchmark (100 iterations)
    warm_latencies = []
    print("\n--- 2. Warm / Cached Query Latencies (100 Iterations) ---")
    for _ in range(5):
        for q in test_queries:
            t0 = time.perf_counter()
            res = se.search(q, user_coords={'lat': 36.2797, 'lng': 50.0049})
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            warm_latencies.append(elapsed_ms)

    warm_p50 = statistics.median(warm_latencies)
    warm_p90 = statistics.quantiles(warm_latencies, n=10)[8]
    warm_p95 = statistics.quantiles(warm_latencies, n=20)[18]
    warm_p99 = statistics.quantiles(warm_latencies, n=100)[98]

    # 3. Concurrent Autocomplete Requests Benchmark (10 workers, 200 total requests)
    print("\n--- 3. Concurrent Autocomplete Load Test (10 Workers, 200 Total Requests) ---")
    concurrent_latencies = []

    def make_autocomplete_request(query):
        t0 = time.perf_counter()
        se.autocomplete(query, user_coords={'lat': 36.2797, 'lng': 50.0049})
        return (time.perf_counter() - t0) * 1000.0

    batch_queries = test_queries * 10  # 200 total requests
    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_autocomplete_request, q) for q in batch_queries]
        for f in futures:
            concurrent_latencies.append(f.result())
    total_batch_time = time.perf_counter() - t_start

    conc_p50 = statistics.median(concurrent_latencies)
    conc_p90 = statistics.quantiles(concurrent_latencies, n=10)[8]
    conc_p95 = statistics.quantiles(concurrent_latencies, n=20)[18]
    conc_p99 = statistics.quantiles(concurrent_latencies, n=100)[98]
    throughput_rps = len(batch_queries) / total_batch_time

    print(f"Total Requests: {len(batch_queries)}")
    print(f"Total Wall Time: {total_batch_time:.3f} s")
    print(f"Throughput: {throughput_rps:.1f} requests/sec")
    print(f"p50 Latency: {conc_p50:.2f} ms")
    print(f"p90 Latency: {conc_p90:.2f} ms")
    print(f"p95 Latency: {conc_p95:.2f} ms")
    print(f"p99 Latency: {conc_p99:.2f} ms")

    print("\n=================================================================")
    print("                    BENCHMARK SUMMARY RESULTS                    ")
    print("=================================================================")
    print(f"Cold Search Median (p50):          {cold_p50:.2f} ms")
    print(f"Cold Search 95th Percentile (p95): {cold_p95:.2f} ms")
    print(f"Warm Search Median (p50):          {warm_p50:.2f} ms")
    print(f"Warm Search 95th Percentile (p95): {warm_p95:.2f} ms")
    print(f"Concurrent Autocomplete p95:       {conc_p95:.2f} ms (TARGET: < 150 ms) -> {'PASSED' if conc_p95 < 150 else 'FAILED'}")
    print("=================================================================\n")

if __name__ == '__main__':
    run_benchmark()
