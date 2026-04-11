# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Prompts used to instruct the language model for text improvements."""

PLATFORM_SPECS: dict[str, dict] = {
    "instagram": {
        "max_chars": 2200,
        "notes": "Use line breaks for readability, 3-5 relevant hashtags at the end, emojis are welcome, hook in the first line is critical.",
    },
    "linkedin": {
        "max_chars": 3000,
        "notes": "Professional and valuable tone, no more than 2 emojis, hook in first line, short paragraphs, no hashtag spam (max 3).",
    },
    "twitter": {
        "max_chars": 280,
        "notes": "Concise and punchy, max 280 characters, 1-2 emojis max, no hashtags unless essential.",
    },
    "tiktok": {
        "max_chars": 300,
        "notes": "Very short caption, energetic and casual tone, 2-3 trending hashtags, emojis encouraged.",
    },
    "youtube": {
        "max_chars": 500,
        "notes": "This is a video description or community post. Clear and engaging, include a call to action, 2-3 hashtags.",
    },
    "facebook": {
        "max_chars": 500,
        "notes": "Conversational and engaging tone, mix of personal and professional, longer posts work well, emojis welcome, encourage interaction with questions.",
    },
}

STYLE_SPECS: dict[str, str] = {
    "professional": (
        "Professional and authoritative tone. Clear, valuable and impactful. "
        "No slang, no excessive emojis. Focus on insight and credibility."
    ),
    "casual": (
        "Conversational, warm and approachable tone. "
        "Speak like a real person, not a brand. Add 2-3 fitting emojis."
    ),
    "viral": (
        "Optimized for maximum engagement. "
        "Start with a powerful hook that stops the scroll. "
        "Create curiosity, emotion or urgency. Be bold."
    ),
}

DEFAULT_STYLE = "professional"
VALID_STYLES = frozenset(STYLE_SPECS.keys())


def build_prompt(text: str, style: str, platform: str | None = None) -> str:
    style_desc = STYLE_SPECS.get(style, STYLE_SPECS[DEFAULT_STYLE])
    platform_spec = PLATFORM_SPECS.get(platform) if platform else None

    platform_block = (
        f"Platform: {platform.upper()}\n"
        f"Max characters: {platform_spec['max_chars']}\n"
        f"Platform guidelines: {platform_spec['notes']}\n"
        if platform_spec
        else "Platform: generic social media. Keep it under 280 characters.\n"
    )

    return (
        f"Improve the following text for social media.\n\n"
        f"Style: {style_desc}\n\n"
        f"{platform_block}\n"
        f"Original text: {text}\n\n"
        f"Return only the improved text, without quotes or explanations.\n"
        f"Respond in the same language as the input text. Do not translate or switch languages."
    )