"""Build Mathematics HTML companions locally; conversion dependencies are not needed on Netlify."""
from pathlib import Path
import argparse,json,os,subprocess
from readable_papers import build
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--no-images',action='store_true')
    parser.add_argument('--level',choices=['N5','Higher','AH'])
    args=parser.parse_args()
    levels=json.loads(subprocess.check_output([os.environ.get('NODE_BINARY','node'),str(ROOT/'scripts/mathematics-source-index.cjs')]))
    for level in levels:
        if not args.level or level['directory'].startswith(args.level+'/'):
            level['textCorrections']='scripts/mathematics-text-corrections.json'
            build(level,no_images=args.no_images)
