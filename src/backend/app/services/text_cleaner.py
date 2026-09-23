import re

# Replace one or more whitespace characters with a single space
# NOTE: This removes line structures
def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()