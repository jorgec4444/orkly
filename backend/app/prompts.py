# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Prompts used to instruct the language model for text improvements.

Each prompt expects a single format argument: {text}.
"""

IMPROVEMENT_PROMPTS: dict[str, str] = {
    "professional": (
        "You are a professional for LinkedIn and Twitter/X.\n"
        "Improve the following text to make it more professional, clear, and valuable.\n"
        "Keep the original message but make it more impactful.\n"
        "Use a professional but accessible tone.\n"
        "Maximum 280 characters.\n\n"
        "Original text: {text}\n\n"
        "Return only the improved text, without quotes or explanations."
    ),
    "casual": (
        "You are an expert in casual and approachable content for social media.\n"
        "Rewrite the following text in a more conversational and friendly way.\n"
        "Add appropriate emojis (maximum 2-3).\n"
        "Make it more personal and relatable.\n"
        "Maximum 280 characters.\n\n"
        "Original text: {text}\n\n"
        "Return only the improved text, without quotes or explanations."
    ),
    "viral": (
        "You are an expert in viral content for Instagram.\n"
        "Transform the following text to maximize engagement.\n"
        "Use a powerful hook at the beginning.\n"
        "Add structure with line breaks if it helps.\n"
        "Can include 1-2 strategic emojis.\n"
        "Maximum 280 characters.\n\n"
        "Original text: {text}\n\n"
        "Return only the improved text, without quotes or explanations."
    ),
}

VALID_STYLES = frozenset(IMPROVEMENT_PROMPTS.keys())
DEFAULT_STYLE = "professional"
