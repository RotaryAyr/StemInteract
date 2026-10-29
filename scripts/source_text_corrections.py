"""Apply reviewed, hash-bound transcriptions; never infer mathematical content."""
import json
import re


def corrections_for(root, level, filename, digest):
    config = level.get('textCorrections')
    if not config:
        return []
    entries = json.loads((root / config).read_text())
    selected = [e for e in entries if e['directory'] == level['directory'] and e['pdf'] == filename]
    for entry in selected:
        if entry['sha256'] != digest:
            raise ValueError(f"Review text correction against changed PDF: {filename}, Q{entry['question']}")
    return selected


def correct_text(text, entries):
    for entry in entries:
        pattern = entry['pattern']
        if len(re.findall(pattern, text)) != 1:
            raise ValueError(f"Text correction no longer matches exactly once: {entry['pdf']}, Q{entry['question']}")
        text = re.sub(pattern, lambda _: entry['replacement'], text)
    return text
