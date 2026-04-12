# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for Pydantic schemas."""
import pytest
from pydantic import ValidationError

from app.feedback.schemas import FeedbackRequest
from app.text_generation.schemas import TextRequest
from app.clients.schemas import ClientUpdateRequest
from app.chat.schemas import ChatMessageRequest, ChatSessionRequest


class TestTextRequest:
    def test_valid_request(self):
        req = TextRequest(text="Hello world")
        assert req.text == "Hello world"

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


class TestFeedbackRequest:
    def test_valid_feedback(self):
        req = FeedbackRequest(feedback="Great app!")
        assert req.feedback == "Great app!"

    def test_empty_feedback_raises(self):
        with pytest.raises(ValidationError):
            FeedbackRequest(feedback="")

    def test_feedback_over_2000_raises(self):
        with pytest.raises(ValidationError):
            FeedbackRequest(feedback="x" * 2001)


class TestClientUpdateRequest:
    def test_valid_update(self):
        req = ClientUpdateRequest(client_name="Acme Corp")
        assert req.client_name == "Acme Corp"

    def test_all_fields_optional(self):
        req = ClientUpdateRequest()
        assert req.client_name is None
        assert req.brand_voice is None
        assert req.platforms is None
        assert req.logo_url is None

    def test_client_name_too_long_raises(self):
        with pytest.raises(ValidationError):
            ClientUpdateRequest(client_name="x" * 101)

    def test_brand_voice_too_long_raises(self):
        with pytest.raises(ValidationError):
            ClientUpdateRequest(brand_voice="x" * 1001)

    def test_logo_url_accepted(self):
        req = ClientUpdateRequest(logo_url="https://assets.orkly.app/logo.png")
        assert req.logo_url == "https://assets.orkly.app/logo.png"


class TestChatSchemas:
    def test_chat_message_request_valid(self):
        req = ChatMessageRequest(message="Hello!")
        assert req.message == "Hello!"

    def test_chat_session_request_no_client(self):
        req = ChatSessionRequest()
        assert req.client_id is None

    def test_chat_session_request_with_client(self):
        req = ChatSessionRequest(client_id=42)
        assert req.client_id == 42
