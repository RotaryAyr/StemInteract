"""Build Biology HTML companions locally; conversion dependencies are not needed on Netlify."""
from pathlib import Path
import argparse,json,os,subprocess
from readable_papers import build
from biology_supplements import build_supplements
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--no-images',action='store_true')
    parser.add_argument('--level',choices=['N5','Higher','AH'])
    args=parser.parse_args()
    levels=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),str(ROOT/'scripts/biology-source-index.cjs')]))
    for level in levels:
        if not args.level or level['directory'].startswith(args.level+'/'):
            build(level,no_images=args.no_images)
            build_supplements(level,no_images=args.no_images)
