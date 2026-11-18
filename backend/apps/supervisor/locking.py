import os
import sys
import time
import logging
from contextlib import contextmanager
from django.db import connection

logger = logging.getLogger(__name__)

# Predefined advisory lock IDs for supervisor background tasks
LOCK_EVALUATE_ALERTS = 19827364
LOCK_CLEANUP_LOGS = 19827365


@contextmanager
def execution_lock(lock_id: int, lock_name: str = "task"):
    """
    قفل همروندی میان‌پروسه‌ای و میان‌کانتینری (Concurrency Execution Lock):
    - در دیتابیس PostgreSQL: استفاده از قفل‌های توصیه‌ای (pg_try_advisory_lock) در سطح جلسه (Session-level)
      که کاملاً اتمیک و هماهنگ میان تمام کانتینرهاست و با قطعی پروسه به طور خودکار آزاد می‌شود.
    - در دیتابیس SQLite / محیط تست و توسعه: استفاده از فایل قفل اتمیک (exclusive creation 'x') در دایرکتوری temp.
    
    این ابزار از اجرای همزمان و تداخل جاب‌های ارزیابی هشدار یا پاک‌سازی لاگ‌ها جلوگیری می‌کند.
    """
    acquired = False
    is_postgres = (connection.vendor == 'postgresql')
    lock_file_path = None

    try:
        if is_postgres:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_try_advisory_lock(%s);", [lock_id])
                row = cursor.fetchone()
                acquired = bool(row and row[0])
        else:
            # File-based lock fallback for SQLite/local dev/pytest
            import tempfile
            lock_file_path = os.path.join(tempfile.gettempdir(), f"iranswim_lock_{lock_id}.lock")
            if os.path.exists(lock_file_path):
                try:
                    mtime = os.path.getmtime(lock_file_path)
                    # If older than 10 minutes, treat as stale crashed process
                    if time.time() - mtime > 600:
                        try:
                            os.remove(lock_file_path)
                        except OSError:
                            pass
                except OSError:
                    pass

            try:
                # Exclusive file creation ('x') is atomic in OS/Python
                with open(lock_file_path, 'x') as f:
                    f.write(f"{os.getpid()}:{time.time()}")
                acquired = True
            except FileExistsError:
                acquired = False
            except OSError:
                acquired = False

        if not acquired:
            logger.warning(
                f"[LOCK_CONTENTION] Could not acquire lock {lock_id} for '{lock_name}'. "
                "Another process/container is already executing this task. Skipping to prevent overlap."
            )
            yield False
            return

        yield True

    finally:
        if acquired:
            if is_postgres:
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT pg_advisory_unlock(%s);", [lock_id])
                except Exception as e:
                    logger.error(f"[LOCK_RELEASE_ERROR] Failed to release Postgres advisory lock {lock_id}: {e}")
            elif lock_file_path and os.path.exists(lock_file_path):
                try:
                    os.remove(lock_file_path)
                except OSError:
                    pass
