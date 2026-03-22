# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for app.schemas."""
import pytest
from pydantic import ValidationError

from backend.app.schemas import FeedbackRequest, TextRequest


class TestTextRequest:
    def test_valid_request(self):
        req = TextRequest(text="Hello world")
        assert req.text == "Hello world"
        assert req.style == "professional"

    def test_strips_whitespace(self):
        req = TextRequest(text="  hello  ")
        assert req.text == "hello"

    def test_empty_text_raises(self):
        with pytest.raises(ValidationError):
            TextRequest(text="")

    def test_blank_text_raises(self):
        with pytest.raises(ValidationError):
            TextRequest(text="   ")

    def test_text_over_500_raises(self):
        with pytest.raises(ValidationError):
            TextRequest(text="x" * 501)

    def test_exactly_500_chars_is_valid(self):
        req = TextRequest(text="x" * 500)
        assert len(req.text) == 500

    def test_custom_style(self):
        req = TextRequest(text="hi", style="viral")
        assert req.style == "viral"

    def test_default_style_is_professional(self):
        req = TextRequest(text="hi")
        assert req.style == "professional"


class TestFeedbackRequest:
    def test_valid_feedback(self):
        req = FeedbackRequest(feedback="Great app!")
        assert req.feedback == "Great app!"

    def test_strips_whitespace(self):
        req = FeedbackRequest(feedback="  nice  ")
        assert req.feedback == "nice"

    def test_empty_feedback_raises(self):
        with pytest.raises(ValidationError):
            FeedbackRequest(feedback="")

    def test_blank_feedback_raises(self):
        with pytest.raises(ValidationError):
            FeedbackRequest(feedback="   ")

    def test_feedback_over_2000_raises(self):
        with pytest.raises(ValidationError):
            FeedbackRequest(feedback="x" * 2001)
