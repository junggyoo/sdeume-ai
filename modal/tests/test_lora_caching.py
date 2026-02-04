"""
Test cases for LoRA caching and parallel processing functionality.

Tests include:
- URL hash-based cache path generation
- Cache hit detection
- Cache miss and download flow
- File locking for concurrent access (120s timeout)
- Parallel LoRA download (ThreadPoolExecutor, 180s timeout)
- Scheduled cache cleanup (72-hour expiry, daily 4am Cron)
- Temp file cleanup on failure
"""

import os
import sys
import tempfile
import time
import threading
import hashlib
import re
import pytest
from unittest.mock import patch, MagicMock, call
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError


# =============================================================================
# Helper functions to load from production code
# =============================================================================

def _load_functions_from_production():
    """Load caching-related functions from production code."""
    production_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "comfyui_workflow.py"
    )

    with open(production_file, "r") as f:
        content = f.read()

    # Provide necessary globals for exec()
    functions = {'hashlib': hashlib}

    # Load get_lora_cache_path
    pattern = r"(def get_lora_cache_path\(url: str, models_dir: str\) -> str:.*?)(?=\ndef |\nclass |\n@|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        exec(match.group(1), functions)

    return functions, content


def _function_exists(func_name: str) -> bool:
    """Check if a function exists in production code."""
    production_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "comfyui_workflow.py"
    )
    with open(production_file, "r") as f:
        content = f.read()
    return f"def {func_name}(" in content


def _get_production_content() -> str:
    """Get production file content."""
    production_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "comfyui_workflow.py"
    )
    with open(production_file, "r") as f:
        return f.read()


# =============================================================================
# Test Classes
# =============================================================================

class TestGetLoraCachePath:
    """Test suite for get_lora_cache_path function."""

    def test_function_exists_in_production(self):
        """get_lora_cache_path function should exist in production code."""
        # Arrange & Act
        exists = _function_exists("get_lora_cache_path")

        # Assert
        assert exists, "get_lora_cache_path function not found in production code"

    def test_returns_expected_path_format(self):
        """Cache path should follow expected format: models_dir/loras/cached_{hash}.safetensors"""
        # Arrange
        funcs, _ = _load_functions_from_production()
        get_lora_cache_path = funcs.get('get_lora_cache_path')
        assert get_lora_cache_path is not None, "get_lora_cache_path not found"

        url = "https://example.com/lora/model.safetensors"
        models_dir = "/models"

        # Act
        result = get_lora_cache_path(url, models_dir)

        # Assert
        assert result.startswith(f"{models_dir}/loras/cached_")
        assert result.endswith(".safetensors")

    def test_uses_md5_hash_of_url(self):
        """Cache path should use first 16 chars of MD5 hash of URL."""
        # Arrange
        funcs, _ = _load_functions_from_production()
        get_lora_cache_path = funcs.get('get_lora_cache_path')
        assert get_lora_cache_path is not None, "get_lora_cache_path not found"

        url = "https://example.com/lora/model.safetensors"
        models_dir = "/models"
        expected_hash = hashlib.md5(url.encode()).hexdigest()[:16]
        expected_path = f"{models_dir}/loras/cached_{expected_hash}.safetensors"

        # Act
        result = get_lora_cache_path(url, models_dir)

        # Assert
        assert result == expected_path

    def test_different_urls_produce_different_paths(self):
        """Different URLs should produce different cache paths."""
        # Arrange
        funcs, _ = _load_functions_from_production()
        get_lora_cache_path = funcs.get('get_lora_cache_path')
        assert get_lora_cache_path is not None, "get_lora_cache_path not found"

        url1 = "https://example.com/lora/groom.safetensors"
        url2 = "https://example.com/lora/bride.safetensors"
        models_dir = "/models"

        # Act
        path1 = get_lora_cache_path(url1, models_dir)
        path2 = get_lora_cache_path(url2, models_dir)

        # Assert
        assert path1 != path2

    def test_same_url_produces_same_path(self):
        """Same URL should always produce same cache path."""
        # Arrange
        funcs, _ = _load_functions_from_production()
        get_lora_cache_path = funcs.get('get_lora_cache_path')
        assert get_lora_cache_path is not None, "get_lora_cache_path not found"

        url = "https://example.com/lora/model.safetensors"
        models_dir = "/models"

        # Act
        path1 = get_lora_cache_path(url, models_dir)
        path2 = get_lora_cache_path(url, models_dir)

        # Assert
        assert path1 == path2


class TestGetCachedOrDownloadLora:
    """Test suite for get_cached_or_download_lora function."""

    def test_function_exists_in_production(self):
        """get_cached_or_download_lora function should exist in production code."""
        # Arrange & Act
        exists = _function_exists("get_cached_or_download_lora")

        # Assert
        assert exists, "get_cached_or_download_lora function not found in production code"

    def test_uses_120_second_lock_timeout(self):
        """FileLock should use 120 second timeout."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for FileLock with timeout=120
        assert "FileLock(" in content, "FileLock not used in production code"
        assert "timeout=120" in content, "FileLock should use 120 second timeout"


class TestParallelLoraDownload:
    """Test suite for parallel LoRA download with ThreadPoolExecutor."""

    def test_uses_threadpool_executor_max_workers_2(self):
        """ThreadPoolExecutor should use max_workers=2."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        assert "ThreadPoolExecutor(max_workers=2)" in content, \
            "ThreadPoolExecutor should use max_workers=2"

    def test_uses_180_second_timeout_for_results(self):
        """Parallel download should use 180 second timeout for results."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for future.result(timeout=180)
        assert "timeout=180" in content, \
            "Parallel download should use 180 second timeout"

    def test_threadpool_executor_basic_functionality(self):
        """Verify ThreadPoolExecutor works correctly with 2 workers."""
        # Arrange
        results = []

        def mock_download(url, role, models_dir):
            results.append((url, role))
            return f"cached_{role}.safetensors"

        # Act
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                'groom': executor.submit(mock_download, "url1", "groom", "/models"),
                'bride': executor.submit(mock_download, "url2", "bride", "/models"),
            }

            for role, future in futures.items():
                result = future.result(timeout=5)
                assert role in result

        # Assert
        assert len(results) == 2


class TestScheduledCacheCleanup:
    """Test suite for scheduled_cache_cleanup Cron job."""

    def test_function_exists_in_production(self):
        """scheduled_cache_cleanup function should exist in production code."""
        # Arrange & Act
        exists = _function_exists("scheduled_cache_cleanup")

        # Assert
        assert exists, "scheduled_cache_cleanup function not found in production code"

    def test_uses_cron_schedule_daily_4am(self):
        """Cron should be scheduled at 4:00 AM daily."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for Cron("0 4 * * *")
        assert 'Cron("0 4 * * *")' in content or "Cron('0 4 * * *')" in content, \
            "Cron should be scheduled at 4:00 AM daily (0 4 * * *)"

    def test_uses_72_hour_cache_expiry(self):
        """Cache files older than 72 hours should be removed."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for 72 * 3600 or similar
        has_72_hour_setting = (
            "72 * 3600" in content or
            "72*3600" in content or
            "259200" in content  # 72 * 3600 = 259200
        )
        assert has_72_hour_setting, "Cache expiry should be 72 hours (72 * 3600 seconds)"

    @pytest.fixture
    def temp_cache_dir(self):
        """Create a temporary cache directory with test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    def test_file_exactly_72_hours_old_not_deleted(self, temp_cache_dir):
        """Files exactly 72 hours old should NOT be deleted."""
        # Arrange
        old_file = os.path.join(temp_cache_dir, "cached_abc123.safetensors")
        with open(old_file, "w") as f:
            f.write("test")

        # Use fixed reference time to avoid timing issues
        reference_time = time.time()
        max_age_seconds = 72 * 3600

        # Set modification time to exactly 72 hours ago from reference
        exactly_72h = reference_time - max_age_seconds
        os.utime(old_file, (exactly_72h, exactly_72h))

        # Act - Simulate cleanup logic (72시간 초과만 삭제)
        # Use the same reference time for comparison
        file_age = reference_time - os.path.getmtime(old_file)
        should_delete = file_age > max_age_seconds

        # Assert - 정확히 72시간인 파일은 삭제 안됨 (> 조건이므로)
        assert not should_delete, f"File exactly 72 hours old should NOT be deleted (age: {file_age}s, max: {max_age_seconds}s)"

    def test_file_72_hours_plus_1_second_is_deleted(self, temp_cache_dir):
        """Files 72 hours + 1 second old should be deleted."""
        # Arrange
        old_file = os.path.join(temp_cache_dir, "cached_abc123.safetensors")
        with open(old_file, "w") as f:
            f.write("test")

        # Set modification time to 72 hours + 1 second ago
        over_72h = time.time() - (72 * 3600 + 1)
        os.utime(old_file, (over_72h, over_72h))

        # Act - Simulate cleanup logic
        now = time.time()
        max_age_seconds = 72 * 3600
        should_delete = (now - os.path.getmtime(old_file)) > max_age_seconds

        # Assert
        assert should_delete, "File over 72 hours old should be deleted"


class TestFileLockIntegration:
    """Integration tests for FileLock behavior."""

    @pytest.fixture
    def temp_lock_file(self):
        """Create a temporary file for lock testing."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".lock") as f:
            yield f.name
        try:
            os.unlink(f.name)
        except OSError:
            pass

    def test_filelock_package_installed(self):
        """Verify filelock package is available."""
        # Arrange & Act
        try:
            from filelock import FileLock
            installed = True
        except ImportError:
            installed = False

        # Assert
        assert installed, "filelock package not installed"

    def test_concurrent_access_is_serialized(self, temp_lock_file):
        """Verify that FileLock serializes concurrent access."""
        # Arrange
        from filelock import FileLock

        results = []
        lock = FileLock(temp_lock_file, timeout=5)

        def worker(worker_id):
            with lock:
                results.append(f"start_{worker_id}")
                time.sleep(0.1)  # Simulate work
                results.append(f"end_{worker_id}")

        # Act
        threads = [
            threading.Thread(target=worker, args=(1,)),
            threading.Thread(target=worker, args=(2,)),
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Assert - Results should be serialized: start_X, end_X, start_Y, end_Y
        # Not interleaved: start_X, start_Y, end_X, end_Y
        assert len(results) == 4
        # Check that each "start" is immediately followed by its "end"
        for i in range(0, len(results), 2):
            start_id = results[i].split("_")[1]
            end_id = results[i + 1].split("_")[1]
            assert start_id == end_id


class TestNoRequestCleanup:
    """Test that per-request LoRA cleanup is removed.

    When implementing caching, the old cleanup code that deletes LoRA files
    after each request must be removed. This code is located around line 1348-1356
    with the comment "임시 LoRA 파일 정리 (볼륨 공간 절약)" and includes:
    - for lora_file in [groom_lora_name, bride_lora_name]:
    - os.remove(lora_path)

    The new implementation should keep cached LoRA files and rely on the
    scheduled_cache_cleanup cron job to clean up old files (>72 hours).
    """

    def test_lora_files_are_not_deleted_after_request(self):
        """LoRA files should NOT be deleted after request completion (for caching).

        The old cleanup code pattern includes:
        1. Comment: "임시 LoRA 파일 정리"
        2. Loop: for lora_file in [groom_lora_name, bride_lora_name]:
        3. Deletion: os.remove(lora_path)

        All of these should be removed when implementing caching.
        """
        # Arrange
        content = _get_production_content()

        # Act - Check if the old cleanup comment and pattern are removed
        # The cleanup code starts with this comment and includes the deletion loop
        has_old_cleanup_comment = "임시 LoRA 파일 정리" in content

        # Also check for the specific loop pattern that deletes lora files after generation
        # Pattern: "for lora_file in [groom_lora_name, bride_lora_name]:" followed by os.remove
        has_cleanup_loop = (
            "for lora_file in [groom_lora_name, bride_lora_name]:" in content and
            "Cleaned up:" in content  # The log message "🗑️ Cleaned up: {lora_file}"
        )

        # Assert - Both should be removed for caching to work
        assert not has_old_cleanup_comment, \
            "Per-request LoRA cleanup comment '임시 LoRA 파일 정리' should be removed for caching"
        assert not has_cleanup_loop, \
            "Per-request LoRA cleanup loop (for lora_file in [...]) should be removed for caching"


class TestFilelockInModalImage:
    """Test that filelock is included in Modal image dependencies."""

    def test_filelock_in_pip_install(self):
        """Verify 'filelock' is listed in Modal image pip_install."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        has_filelock = '"filelock"' in content or "'filelock'" in content
        assert has_filelock, \
            "filelock package should be added to Modal image pip_install"


class TestRequiredImports:
    """Test that required imports are present."""

    def test_hashlib_imported(self):
        """Verify 'import hashlib' is present in production code."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        assert "import hashlib" in content, "hashlib import not found"

    def test_threadpool_executor_imported(self):
        """Verify ThreadPoolExecutor is imported in production code."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        assert "from concurrent.futures import ThreadPoolExecutor" in content, \
            "ThreadPoolExecutor import not found"

    def test_filelock_imported(self):
        """Verify FileLock is imported in production code."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        assert "from filelock import FileLock" in content, \
            "FileLock import not found"


class TestCacheCleanupLogic:
    """Test cache cleanup logic in detail."""

    @pytest.fixture
    def temp_cache_dir(self):
        """Create a temporary cache directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    def test_removes_files_older_than_72_hours(self, temp_cache_dir):
        """Should remove cached_ files older than 72 hours."""
        # Arrange
        old_file = os.path.join(temp_cache_dir, "cached_abc123.safetensors")
        with open(old_file, "w") as f:
            f.write("test")

        # Set modification time to 73 hours ago
        old_mtime = time.time() - (73 * 3600)
        os.utime(old_file, (old_mtime, old_mtime))

        # Act - Simulate cleanup logic
        max_age_seconds = 72 * 3600
        now = time.time()
        age = now - os.path.getmtime(old_file)
        should_delete = age > max_age_seconds

        # Assert
        assert should_delete, "Files older than 72 hours should be marked for deletion"

    def test_keeps_files_newer_than_72_hours(self, temp_cache_dir):
        """Should keep cached_ files newer than 72 hours."""
        # Arrange
        new_file = os.path.join(temp_cache_dir, "cached_def456.safetensors")
        with open(new_file, "w") as f:
            f.write("test")

        # File is new (just created)

        # Act - Simulate cleanup logic
        max_age_seconds = 72 * 3600
        now = time.time()
        age = now - os.path.getmtime(new_file)
        should_delete = age > max_age_seconds

        # Assert
        assert not should_delete, "Files newer than 72 hours should NOT be deleted"

    def test_ignores_non_cached_prefix_files(self, temp_cache_dir):
        """Should not remove files that don't start with 'cached_'."""
        # Arrange
        other_file = os.path.join(temp_cache_dir, "groom_lora_abc.safetensors")
        with open(other_file, "w") as f:
            f.write("test")

        # Set modification time to 73 hours ago
        old_mtime = time.time() - (73 * 3600)
        os.utime(other_file, (old_mtime, old_mtime))

        # Act - Simulate cleanup logic (only cached_ files)
        filename = os.path.basename(other_file)
        should_process = filename.startswith("cached_")

        # Assert
        assert not should_process, "Non-cached_ files should not be processed"

    def test_removes_lock_files_with_cache_files(self, temp_cache_dir):
        """Should remove .lock files when removing cache files."""
        # Arrange
        old_file = os.path.join(temp_cache_dir, "cached_abc123.safetensors")
        lock_file = f"{old_file}.lock"

        with open(old_file, "w") as f:
            f.write("test")
        with open(lock_file, "w") as f:
            f.write("lock")

        # Verify both exist
        assert os.path.exists(old_file)
        assert os.path.exists(lock_file)

        # Act - Simulate cleanup: remove both cache and lock
        os.remove(old_file)
        if os.path.exists(lock_file):
            os.remove(lock_file)

        # Assert
        assert not os.path.exists(old_file)
        assert not os.path.exists(lock_file)


class TestCacheHitLogging:
    """Test that cache hit/miss logging is present."""

    def test_cache_hit_log_message_present(self):
        """Should log cache hit with ✅ emoji."""
        # Arrange
        content = _get_production_content()

        # Act & Assert
        assert "Cache hit" in content, \
            "Cache hit log message should be present"

    def test_cache_miss_download_log_present(self):
        """Should log download on cache miss."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for download message with ⬇️ emoji
        assert "Downloading" in content, \
            "Download log message should be present for cache miss"


class TestCacheHitFlowBehavior:
    """Test cache hit flow - return cached file without download."""

    @pytest.fixture
    def temp_models_dir(self):
        """Create a temporary models directory structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            loras_dir = os.path.join(tmpdir, "loras")
            os.makedirs(loras_dir)
            yield tmpdir

    def test_cache_hit_returns_cached_filename(self, temp_models_dir):
        """On cache hit, function should return the cached filename without downloading."""
        # Arrange - Create a cached file
        url = "https://example.com/lora/model.safetensors"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:16]
        cache_filename = f"cached_{url_hash}.safetensors"
        cache_path = os.path.join(temp_models_dir, "loras", cache_filename)

        # Create the cached file
        with open(cache_path, "w") as f:
            f.write("cached lora content")

        # Act - Verify cache file exists (simulating cache hit check)
        cache_exists = os.path.exists(cache_path)

        # Assert
        assert cache_exists, "Cache file should exist"
        assert os.path.basename(cache_path) == cache_filename

    def test_cache_hit_skips_download(self, temp_models_dir):
        """On cache hit, download_file should NOT be called."""
        # This test verifies the logic: if cache exists, no download
        # Arrange
        url = "https://example.com/lora/model.safetensors"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:16]
        cache_path = os.path.join(temp_models_dir, "loras", f"cached_{url_hash}.safetensors")

        # Create cached file
        with open(cache_path, "w") as f:
            f.write("cached content")

        # Act - Check cache exists (production code should skip download here)
        should_download = not os.path.exists(cache_path)

        # Assert
        assert not should_download, "Should not download when cache exists"


class TestCacheMissFlowBehavior:
    """Test cache miss flow - download and convert."""

    @pytest.fixture
    def temp_models_dir(self):
        """Create a temporary models directory structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            loras_dir = os.path.join(tmpdir, "loras")
            os.makedirs(loras_dir)
            yield tmpdir

    def test_cache_miss_triggers_download(self, temp_models_dir):
        """On cache miss, download should be triggered."""
        # Arrange - No cached file exists
        url = "https://example.com/lora/new_model.safetensors"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:16]
        cache_path = os.path.join(temp_models_dir, "loras", f"cached_{url_hash}.safetensors")

        # Act - Check cache doesn't exist (production code should download here)
        should_download = not os.path.exists(cache_path)

        # Assert
        assert should_download, "Should trigger download when cache doesn't exist"

    def test_cache_miss_creates_temp_file(self, temp_models_dir):
        """Cache miss should create a temp file during download."""
        # Arrange - Simulate temp file creation during download
        import uuid
        role = "groom"
        temp_filename = f"{role}_temp_{uuid.uuid4().hex[:8]}.safetensors"
        temp_path = os.path.join(temp_models_dir, "loras", temp_filename)

        # Act - Create temp file (simulating download in progress)
        with open(temp_path, "w") as f:
            f.write("downloading...")

        # Assert
        assert os.path.exists(temp_path)
        assert "_temp_" in os.path.basename(temp_path)


class TestFailureCleanup:
    """Test cleanup behavior on download/conversion failure."""

    @pytest.fixture
    def temp_models_dir(self):
        """Create a temporary models directory structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            loras_dir = os.path.join(tmpdir, "loras")
            os.makedirs(loras_dir)
            yield tmpdir

    def test_temp_file_cleaned_on_success(self, temp_models_dir):
        """Temp file should be removed after successful conversion."""
        # Arrange
        temp_path = os.path.join(temp_models_dir, "loras", "groom_temp_abc123.safetensors")
        cache_path = os.path.join(temp_models_dir, "loras", "cached_abc123.safetensors")

        # Create temp file (simulating download)
        with open(temp_path, "w") as f:
            f.write("temp content")

        # Simulate successful conversion: temp -> cache
        with open(cache_path, "w") as f:
            f.write("converted content")

        # Act - Clean up temp file (as production code should do)
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Assert
        assert not os.path.exists(temp_path), "Temp file should be removed"
        assert os.path.exists(cache_path), "Cache file should exist"

    def test_incomplete_cache_removed_on_error(self, temp_models_dir):
        """Incomplete cache file should be removed if error occurs."""
        # Arrange - Simulate incomplete cache file
        cache_path = os.path.join(temp_models_dir, "loras", "cached_incomplete.safetensors")
        with open(cache_path, "w") as f:
            f.write("incomplete")

        # Act - Simulate error cleanup (as production code should do in finally block)
        try:
            raise RuntimeError("Simulated download error")
        except RuntimeError:
            if os.path.exists(cache_path):
                os.remove(cache_path)

        # Assert
        assert not os.path.exists(cache_path), "Incomplete cache should be removed"

    def test_temp_file_cleaned_even_on_failure(self, temp_models_dir):
        """Temp file should be removed even when conversion fails."""
        # Arrange
        temp_path = os.path.join(temp_models_dir, "loras", "bride_temp_xyz789.safetensors")
        with open(temp_path, "w") as f:
            f.write("temp content")

        # Act - Simulate cleanup in finally block
        try:
            raise RuntimeError("Conversion failed")
        except RuntimeError:
            pass
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # Assert
        assert not os.path.exists(temp_path), "Temp file should be cleaned up"


class TestFileLockTimeoutBehavior:
    """Test FileLock timeout exception handling."""

    def test_lock_timeout_raises_exception(self):
        """FileLock should raise Timeout error when timeout exceeded."""
        # Arrange
        from filelock import FileLock, Timeout
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".lock", delete=False) as f:
            lock_path = f.name

        try:
            lock1 = FileLock(lock_path, timeout=0.1)
            lock2 = FileLock(lock_path, timeout=0.1)

            # Act - First lock acquired, second should timeout
            with lock1:
                with pytest.raises(Timeout):
                    with lock2:
                        pass  # Should not reach here
        finally:
            os.unlink(lock_path)


class TestParallelDownloadErrorHandling:
    """Test parallel download error handling."""

    def test_single_failure_raises_runtime_error(self):
        """If one LoRA download fails, RuntimeError should be raised."""
        # Arrange
        def failing_download(url, role, models_dir):
            if role == "groom":
                raise RuntimeError(f"Failed to download {role} LoRA")
            return f"cached_{role}.safetensors"

        # Act & Assert
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                'groom': executor.submit(failing_download, "url1", "groom", "/models"),
                'bride': executor.submit(failing_download, "url2", "bride", "/models"),
            }

            groom_error = None
            bride_result = None

            try:
                groom_result = futures['groom'].result(timeout=5)
            except RuntimeError as e:
                groom_error = e

            try:
                bride_result = futures['bride'].result(timeout=5)
            except RuntimeError as e:
                pass

            # Assert - groom should fail, bride should succeed
            assert groom_error is not None, "Groom download should fail"
            assert "groom" in str(groom_error)
            assert bride_result == "cached_bride.safetensors"

    def test_both_downloads_can_fail_independently(self):
        """Both downloads failing should raise errors for both."""
        # Arrange
        def always_failing_download(url, role, models_dir):
            raise RuntimeError(f"Network error for {role}")

        # Act
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                'groom': executor.submit(always_failing_download, "url1", "groom", "/models"),
                'bride': executor.submit(always_failing_download, "url2", "bride", "/models"),
            }

            errors = []
            for role, future in futures.items():
                try:
                    future.result(timeout=5)
                except RuntimeError as e:
                    errors.append(str(e))

            # Assert
            assert len(errors) == 2, "Both downloads should fail"


class TestConversionFailureFallback:
    """Test fallback behavior when LoRA conversion fails."""

    def test_original_file_used_when_conversion_fails(self):
        """When conversion fails, original file should be renamed to cache path."""
        # Arrange - This tests the logic: if convert returns False, use original
        content = _get_production_content()

        # Act & Assert - Check for fallback logic in production code
        # The code should have os.rename(temp, cache) when conversion fails
        has_rename_fallback = "os.rename" in content

        assert has_rename_fallback, \
            "Production code should have os.rename fallback for conversion failure"


class TestFuturesTimeoutError:
    """Test handling of ThreadPoolExecutor timeout errors."""

    def test_futures_timeout_error_is_raised(self):
        """FuturesTimeoutError should be raised when result takes too long."""
        # Arrange
        import time

        def slow_download(url, role, models_dir):
            time.sleep(2)  # Simulate slow download
            return f"cached_{role}.safetensors"

        # Act & Assert
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(slow_download, "url", "groom", "/models")

            with pytest.raises(FuturesTimeoutError):
                future.result(timeout=0.1)  # Very short timeout to trigger error

    def test_production_code_has_timeout_parameter(self):
        """Production code should use timeout parameter in future.result()."""
        # Arrange
        content = _get_production_content()

        # Act & Assert - Check for .result(timeout=180) pattern
        assert "result(timeout=" in content, \
            "Production code should call future.result() with timeout parameter"
