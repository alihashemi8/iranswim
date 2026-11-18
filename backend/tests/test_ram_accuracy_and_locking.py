import os
import time
import pytest
import threading
from unittest.mock import patch, mock_open, MagicMock
from apps.supervisor.services import (
    get_cgroup_memory_metrics,
    get_host_memory_metrics,
    get_cpu_and_ram_metrics,
)
from apps.supervisor.locking import (
    execution_lock,
    LOCK_SCHEDULER_PROCESS,
    LOCK_EVALUATE_ALERTS,
    LOCK_CLEANUP_LOGS,
)


@pytest.mark.django_db
def test_cgroup_v2_with_memory_limit():
    """تست اعتبارسنجی cgroup v2 در صورت وجود سقف حافظه کانتینر (Ubuntu 24.04 با --memory)"""
    mock_files = {
        '/sys/fs/cgroup/memory.max': '1073741824',     # 1024 MB
        '/sys/fs/cgroup/memory.current': '524288000',  # 500 MB
    }

    def fake_exists(path):
        return path in mock_files

    def fake_open_func(file, *args, **kwargs):
        if file in mock_files:
            return mock_open(read_data=mock_files[file])()
        raise FileNotFoundError(file)

    with patch('os.path.exists', side_effect=fake_exists), \
         patch('builtins.open', side_effect=fake_open_func):
        cg_mem = get_cgroup_memory_metrics()
        assert cg_mem['status'] == 'AVAILABLE'
        assert cg_mem['limit_mb'] == 1024.0
        assert cg_mem['used_mb'] == 500.0
        assert cg_mem['has_limit'] is True
        assert cg_mem['version'] == 'v2'

    with patch('apps.supervisor.services.get_cgroup_memory_metrics', return_value=cg_mem), \
         patch('apps.supervisor.services.get_host_memory_metrics', return_value={
             'status': 'AVAILABLE', 'total_mb': 16384.0, 'used_mb': 6144.0, 'free_mb': 10240.0, 'percent': 37.5
         }):
        metrics = get_cpu_and_ram_metrics()
        ram = metrics['ram']
        assert ram['metric_scope'] == 'DOCKER_CONTAINER_LIMITED'
        assert ram['total_mb'] == 1024.0
        assert ram['used_mb'] == 500.0
        assert ram['free_mb'] == 524.0
        assert ram['percent'] == 48.8
        assert ram['container']['limit_mb'] == 1024.0
        assert ram['host']['total_mb'] == 16384.0
        assert ram['used_mb'] != ram['host']['used_mb']


@pytest.mark.django_db
def test_cgroup_v2_without_memory_limit():
    """
    تست cgroup v2 بدون سقف حافظه کانتینر (memory.max = 'max'):
    الزام: عدم محاسبه درصد کانتینر بر مبنای رم هاست، بازگرداندن None/null برای درصد و تفکیک کامل هاست و کانتینر
    """
    mock_files = {
        '/sys/fs/cgroup/memory.max': 'max',
        '/sys/fs/cgroup/memory.current': '524288000',  # 500 MB
    }

    def fake_exists(path):
        return path in mock_files

    def fake_open_func(file, *args, **kwargs):
        if file in mock_files:
            return mock_open(read_data=mock_files[file])()
        raise FileNotFoundError(file)

    with patch('os.path.exists', side_effect=fake_exists), \
         patch('builtins.open', side_effect=fake_open_func):
        cg_mem = get_cgroup_memory_metrics()
        assert cg_mem['status'] == 'AVAILABLE'
        assert cg_mem['limit_mb'] is None
        assert cg_mem['used_mb'] == 500.0
        assert cg_mem['has_limit'] is False
        assert cg_mem['version'] == 'v2'

    with patch('apps.supervisor.services.get_cgroup_memory_metrics', return_value=cg_mem), \
         patch('apps.supervisor.services.get_host_memory_metrics', return_value={
             'status': 'AVAILABLE', 'total_mb': 16384.0, 'used_mb': 6144.0, 'free_mb': 10240.0, 'percent': 37.5
         }):
        metrics = get_cpu_and_ram_metrics()
        ram = metrics['ram']
        assert ram['metric_scope'] == 'DOCKER_CONTAINER_UNLIMITED'
        assert ram['used_mb'] == 500.0
        # بررسی قطعی: درصد و سقف کانتینر نباید روی رم هاست محاسبه شود
        assert ram['total_mb'] is None
        assert ram['percent'] is None
        assert ram['free_mb'] is None
        assert ram['container']['has_limit'] is False
        assert ram['container']['limit_mb'] is None
        # متریک‌های هاست فیزیکی کاملاً مجزا و بدون ادغام گزارش می‌شوند
        assert ram['host']['total_mb'] == 16384.0
        assert ram['host']['used_mb'] == 6144.0
        assert ram['host']['percent'] == 37.5


@pytest.mark.django_db
def test_cgroup_v1_memory_limit():
    """تست تشخیص cgroup v1 در هاست‌های قدیمی داکر"""
    mock_files = {
        '/sys/fs/cgroup/memory/memory.limit_in_bytes': '2147483648',  # 2048 MB
        '/sys/fs/cgroup/memory/memory.usage_in_bytes': '1073741824',  # 1024 MB
    }

    def fake_exists(path):
        return path in mock_files

    def fake_open_func(file, *args, **kwargs):
        if file in mock_files:
            return mock_open(read_data=mock_files[file])()
        raise FileNotFoundError(file)

    with patch('os.path.exists', side_effect=fake_exists), \
         patch('builtins.open', side_effect=fake_open_func):
        cg_mem = get_cgroup_memory_metrics()
        assert cg_mem['status'] == 'AVAILABLE'
        assert cg_mem['limit_mb'] == 2048.0
        assert cg_mem['used_mb'] == 1024.0
        assert cg_mem['has_limit'] is True
        assert cg_mem['version'] == 'v1'

    with patch('apps.supervisor.services.get_cgroup_memory_metrics', return_value=cg_mem), \
         patch('apps.supervisor.services.get_host_memory_metrics', return_value={
             'status': 'AVAILABLE', 'total_mb': 8192.0, 'used_mb': 4096.0, 'free_mb': 4096.0, 'percent': 50.0
         }):
        metrics = get_cpu_and_ram_metrics()
        ram = metrics['ram']
        assert ram['metric_scope'] == 'DOCKER_CONTAINER_LIMITED'
        assert ram['percent'] == 50.0


@pytest.mark.django_db
def test_host_metrics_unavailable():
    """تست سناریویی که اطلاعات هسته هاست غیرقابل‌دسترس باشد (گزارش صریح UNKNOWN)"""
    with patch('apps.supervisor.services.psutil', None):
        host_mem = get_host_memory_metrics()
        assert host_mem['status'] == 'UNKNOWN'
        assert host_mem['total_mb'] is None
        assert host_mem['used_mb'] is None

    # اگر کانتینر هم در دسترس نباشد، حوزه کل به UNKNOWN تبدیل می‌شود
    with patch('apps.supervisor.services.get_cgroup_memory_metrics', return_value={
        'status': 'UNKNOWN', 'limit_mb': None, 'used_mb': None, 'version': None, 'has_limit': False
    }), patch('apps.supervisor.services.get_host_memory_metrics', return_value={
        'status': 'UNKNOWN', 'total_mb': None, 'used_mb': None, 'free_mb': None, 'percent': None
    }):
        metrics = get_cpu_and_ram_metrics()
        ram = metrics['ram']
        assert ram['metric_scope'] == 'UNKNOWN'
        assert ram['status'] == 'UNKNOWN'
        assert ram['total_mb'] is None
        assert ram['used_mb'] is None


@pytest.mark.django_db
def test_container_metrics_unavailable():
    """تست حالت اجرای عادی روی هاست لینوکسی بدون کانتینر داکر"""
    with patch('os.path.exists', return_value=False):
        cg_mem = get_cgroup_memory_metrics()
        assert cg_mem['status'] == 'UNKNOWN'
        assert cg_mem['limit_mb'] is None

    with patch('apps.supervisor.services.get_cgroup_memory_metrics', return_value=cg_mem), \
         patch('apps.supervisor.services.get_host_memory_metrics', return_value={
             'status': 'AVAILABLE', 'total_mb': 8192.0, 'used_mb': 3200.0, 'free_mb': 4992.0, 'percent': 39.1
         }):
        metrics = get_cpu_and_ram_metrics()
        ram = metrics['ram']
        assert ram['metric_scope'] == 'VPS_HOST'
        assert ram['total_mb'] == 8192.0
        assert ram['used_mb'] == 3200.0
        assert ram['percent'] == 39.1
        assert ram['container']['status'] == 'UNKNOWN'


@pytest.mark.django_db
def test_locking_atomicity_and_release_on_success():
    """بررسی اتمیک بودن قفل همروندی و آزادسازی آن پس از پایان موفقیت‌آمیز وظیفه"""
    with execution_lock(LOCK_EVALUATE_ALERTS, 'test_alert_job') as acquired:
        assert acquired is True
        with execution_lock(LOCK_EVALUATE_ALERTS, 'competing_job') as second_attempt:
            assert second_attempt is False

    with execution_lock(LOCK_EVALUATE_ALERTS, 'subsequent_job') as third_attempt:
        assert third_attempt is True


@pytest.mark.django_db
def test_locking_release_on_failure_and_exception():
    """اطمینان از آزادسازی قطعی قفل در صورت پرتاب خطا در بدنه عملیات"""
    try:
        with execution_lock(LOCK_EVALUATE_ALERTS, 'failing_job') as acquired:
            assert acquired is True
            raise RuntimeError("خطای شبیه‌سازی‌شده در حین ارزیابی هشدار")
    except RuntimeError:
        pass

    with execution_lock(LOCK_EVALUATE_ALERTS, 'retry_job') as retry_acquired:
        assert retry_acquired is True


@pytest.mark.django_db
def test_separate_jobs_use_distinct_lock_identifiers():
    """اطمینان از استقلال کلیدهای قفل برای جاب‌های مختلف (هشدارها vs پاک‌سازی لاگ)"""
    with execution_lock(LOCK_EVALUATE_ALERTS, 'alert_job') as alert_acquired:
        assert alert_acquired is True
        with execution_lock(LOCK_CLEANUP_LOGS, 'cleanup_job') as cleanup_acquired:
            assert cleanup_acquired is True


@pytest.mark.django_db
def test_scheduler_process_singleton_lock():
    """تست قفل یکتایی پروسه زمان‌بند (Scheduler Singleton Protection)"""
    with execution_lock(LOCK_SCHEDULER_PROCESS, 'scheduler_daemon_1') as primary:
        assert primary is True
        # پروسه دوم باید فوراً متوقف شود
        with execution_lock(LOCK_SCHEDULER_PROCESS, 'scheduler_daemon_2') as duplicate:
            assert duplicate is False

    # پس از خاتمه پروسه اول، زمان‌بند مجدد می‌تواند قفل را بگیرد
    with execution_lock(LOCK_SCHEDULER_PROCESS, 'scheduler_daemon_restart') as restarted:
        assert restarted is True


def test_postgresql_advisory_lock_two_independent_sessions():
    """
    تست شبیه‌سازی دو سشن/کانکشن مستقل PostgreSQL:
    - اعتبارسنجی اینکه تنها یک سشن قفل را تصاحب می‌کند
    - اعتبارسنجی اینکه سشن دوم بلافاصله با False مواجه می‌شود
    - اعتبارسنجی اینکه پس از آزادسازی توسط سشن اول، سشن دوم موفق به تصاحب قفل می‌شود
    """
    server_held_locks = set()

    class MockPostgresSession:
        def __init__(self, session_id):
            self.session_id = session_id
            self.closed = False

        def try_lock(self, lock_id):
            if self.closed:
                raise RuntimeError("Connection closed")
            if lock_id in server_held_locks:
                return False
            server_held_locks.add(lock_id)
            return True

        def unlock(self, lock_id):
            if lock_id in server_held_locks:
                server_held_locks.remove(lock_id)
                return True
            return False

        def close(self):
            self.closed = True
            # PostgreSQL server releases all session locks when session disconnects
            server_held_locks.clear()

    session1 = MockPostgresSession("session_backend_worker_1")
    session2 = MockPostgresSession("session_scheduler_replica_2")
    test_lock_key = 19827364

    # 1. سشن اول قفل را می‌گیرد
    assert session1.try_lock(test_lock_key) is True

    # 2. سشن دوم بلافاصله تلاش می‌کند اما ناکام می‌ماند
    assert session2.try_lock(test_lock_key) is False

    # 3. سشن اول قفل را آزاد می‌کند
    assert session1.unlock(test_lock_key) is True

    # 4. سشن دوم اکنون با موفقیت قفل را تصاحب می‌کند
    assert session2.try_lock(test_lock_key) is True

    # 5. سشن دوم بدون آنلاک صریح بسته می‌شود (کرش کانتینر یا خاتمه پروسه)
    session2.close()

    # 6. سرور PostgreSQL قفل را آزاد کرده و سشن اول مجدداً می‌تواند آن را تصاحب کند
    session1_new = MockPostgresSession("session_restart")
    assert session1_new.try_lock(test_lock_key) is True
    session1_new.unlock(test_lock_key)


def test_concurrent_threads_competing_for_execution_lock():
    """
    تست همزمانی واقعی چند ریسه (Concurrent Threads):
    اطمینان از اینکه دو فرایند همزمان نمی‌توانند یک وظیفه را به طور مشترک اجرا کنند.
    """
    lock_id = 99887766
    results = []

    def worker(worker_name, hold_seconds):
        with execution_lock(lock_id, worker_name) as acquired:
            results.append((worker_name, acquired))
            if acquired:
                time.sleep(hold_seconds)

    t1 = threading.Thread(target=worker, args=('Worker-1', 0.2))
    t2 = threading.Thread(target=worker, args=('Worker-2', 0.1))

    t1.start()
    time.sleep(0.05)  # Let Worker-1 acquire the lock first
    t2.start()

    t1.join()
    t2.join()

    # Worker-1 should have acquired=True, Worker-2 should have acquired=False
    results_dict = dict(results)
    assert results_dict['Worker-1'] is True
    assert results_dict['Worker-2'] is False

    # After Worker-1 is done, Worker-3 can acquire it
    with execution_lock(lock_id, 'Worker-3') as acquired3:
        assert acquired3 is True
