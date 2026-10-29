"""Reviewed transcriptions must stop, rather than drift, when their source changes."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('corrections', ROOT/'scripts/source_text_corrections.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Corrections(unittest.TestCase):
    def test_pdf_change_requires_review(self):
        level={'directory':'AH/Maths-AH','textCorrections':'scripts/mathematics-text-corrections.json'}
        with self.assertRaisesRegex(ValueError, 'changed PDF'):
            module.corrections_for(ROOT, level, 'NAH_Mathematics_Paper2_2026.PDF', 'different-pdf')

    def test_missing_or_duplicate_match_requires_review(self):
        entry={'pdf':'paper.pdf','question':3,'pattern':'z = 3','replacement':'z = sqrt(3)'}
        for text in ['z = 4', 'z = 3 and z = 3']:
            with self.assertRaisesRegex(ValueError, 'exactly once'):
                module.correct_text(text, [entry])
        self.assertEqual(module.correct_text('z = 3 + i', [entry]), 'z = sqrt(3) + i')

    def test_only_selected_pdf_is_affected(self):
        level={'directory':'AH/Maths-AH','textCorrections':'scripts/mathematics-text-corrections.json'}
        self.assertEqual(module.corrections_for(ROOT, level, 'NAH_Mathematics_Paper2_2025.PDF', 'other'), [])
        self.assertEqual(module.corrections_for(ROOT, {}, 'anything.pdf', 'other'), [])

    def test_reviewed_pdf_hashes(self):
        for e in json.loads((ROOT/'scripts/mathematics-text-corrections.json').read_text()):
            actual=hashlib.sha256((ROOT/e['directory']/e['pdf']).read_bytes()).hexdigest()
            self.assertEqual(actual, e['sha256'])

if __name__=='__main__':
    unittest.main()
