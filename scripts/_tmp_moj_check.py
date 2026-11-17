import pathlib, sys

pats = {'.py','.html','.js','.css','.json','.md','.ini','.yml','.yaml','.toml'}
for p in sorted(pathlib.Path('.').rglob('*')):
    if not p.is_file():
        continue
    if any(part.startswith('.') for part in p.parts):
        continue
    if p.suffix not in pats:
        continue
    try:
        s = p.read_text(encoding='utf-8')
    except Exception:
        continue
    try:
        t = s.encode('cp1251').decode('utf-8')
        status = 'WHOLE_OK'
    except Exception as e:
        status = 'FAIL: ' + str(e)[:100]
    print(f"{status}\t{p.as_posix()}\t{len(s)}", flush=True)
PY