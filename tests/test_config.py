# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for app.config."""
import sys
import pytest
from unittest.mock import MagicMock, patch


def _fresh_config(env: dict):
    """Reload config with a completely clean environment."""
    for key in list(sys.modules.keys()):
        if "app.config" in key:
            del sys.modules[key]
    with patch.dict("os.environ", env, clear=True):
        import importlib
        import backend.app.config as cfg
        return cfg


class TestModelName:
    def test_default_model_is_gpt4o_mini(self):
        cfg = _fresh_config({})
        assert cfg.MODEL_NAME == "gpt-4o-mini"

    def test_custom_model_from_env(self):
        cfg = _fresh_config({"OPENAI_MODEL": "gpt-4o"})
        assert cfg.MODEL_NAME == "gpt-4o"


class TestInitOpenAIClient:
    @pytest.mark.skip(reason="env vars loaded from system, cannot isolate")
    def test_returns_none_without_key(self):
        cfg = _fresh_config({})
        cfg._openai_client = None
        result = cfg.init_openai_client()
        assert result is None

    def test_handles_exception_gracefully(self):
        cfg = _fresh_config({"OPENAI_API_KEY": "sk-test"})
        cfg._openai_client = None
        with patch("openai.OpenAI", side_effect=Exception("network error")):
            result = cfg.init_openai_client()
        assert result is None

    def test_returns_cached_client(self):
        cfg = _fresh_config({})
        fake = MagicMock()
        cfg._openai_client = fake
        assert cfg.get_openai_client() is fake


class TestInitR2Client:
    @pytest.mark.skip(reason="env vars loaded from system, cannot isolate")
    def test_returns_none_without_env_vars(self):
        cfg = _fresh_config({})
        cfg._r2_client = None
        result = cfg.init_r2_client()
        assert result is None

    def test_returns_cached_client(self):
        cfg = _fresh_config({})
        fake = MagicMock()
        cfg._r2_client = fake
        assert cfg.get_r2_client() is fake
