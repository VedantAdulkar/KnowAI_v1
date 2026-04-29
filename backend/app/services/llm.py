from app.settings import settings
from app.services.text_clean import strip_html_tags


def summarize_card(title: str, description: str | None) -> str:
    body = (strip_html_tags(description) or "").strip()[:4000]
    if not settings.openai_api_key:
        if body:
            return (title.strip() + " — " + body[:280]).strip()[:400]
        return title.strip()[:400]

    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Summarize into 2 short sentences for a swipe card. No clickbait. Plain English.",
            },
            {
                "role": "user",
                "content": f"Title: {title}\n\nExcerpt:\n{body}",
            },
        ],
        max_tokens=120,
        temperature=0.3,
    )
    text = (resp.choices[0].message.content or "").strip()
    return text[:500] if text else title[:400]
