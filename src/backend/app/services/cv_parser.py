from pathlib import Path
from pypdf import PdfReader

from app.services.text_cleaner import clean_text

# Extract text from PDF
def extract_text(file_path: Path) -> str:
    reader = PdfReader(file_path)

    text = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text.append(page_text)

    return clean_text("\n".join(text))