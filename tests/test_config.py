# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for app.config."""
import sys
from unittest.mock import MagicMock, patch


def _reload_config(env: dict):
    """Reload config module with a custom environment."""
    with patch.dict("os.environ", env, clear=True):
        if "backend.app.config" in sys.modules:
            del sys.modules["backend.app.config"]
        import backend.app.config as cfg
        return cfg


class TestParseIntEnv:
    def test_valid_integer(self):
        cfg = _reload_config({"MAX_FREE_GENERATIONS_PER_DAY": "10"})
        assert cfg.FREE_DAILY_LIMIT == 10

    def test_missing_uses_default(self):
        cfg = _reload_config({})
        assert cfg.FREE_DAILY_LIMIT == 5  # hard-coded default

    def test_invalid_value_uses_default(self, capsys):
        cfg = _reload_config({"MAX_FREE_GENERATIONS_PER_DAY": "not_a_number"})
        assert cfg.FREE_DAILY_LIMIT == 5
        captured = capsys.readouterr()
        assert "not a valid integer" in captured.out


class TestModelName:
    def test_default_model_is_valid(self):
        cfg = _reload_config({})
        assert cfg.MODEL_NAME == "gpt-4o-mini"

    def test_custom_model_from_env(self):
        cfg = _reload_config({"OPENAI_MODEL": "gpt-4o"})
        assert cfg.MODEL_NAME == "gpt-4o"


class TestInitOpenAIClient:
    def test_returns_none_without_key(self):
        with patch.dict("os.environ", {}, clear=True):
            with patch("openai.OpenAI", side_effect=Exception("should not be called")):
                if "backend.app.config" in sys.modules:
                    del sys.modules["backend.app.config"]
                import backend.app.config as cfg
                cfg._openai_client = None # Reset cached client
                result = cfg.init_openai_client()
        assert result is None

    def test_initialises_with_valid_key(self):
        cfg = _reload_config({"OPENAI_API_KEY": "sk-test"})
        fake_client = MagicMock()
        with patch("openai.OpenAI", return_value=fake_client):
            result = cfg.init_openai_client()
        assert result is fake_client

    def test_handles_import_error_gracefully(self):
        cfg = _reload_config({"OPENAI_API_KEY": "sk-test"})
        with patch("openai.OpenAI", side_effect=Exception("network error")):
            result = cfg.init_openai_client()
        assert result is None
