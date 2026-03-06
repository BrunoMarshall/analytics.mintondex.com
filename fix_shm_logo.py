import io

f = io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', encoding='utf-8').read()

old = '<div className="token-icon" style={{ width: 42, height: 42, fontSize: 13 }}>SH</div>'
new = '<TokenIcon symbol="SHM" size={42} isSHM={true} />'

if old in f:
    f = f.replace(old, new)
    print("fixed SHM logo")
else:
    print("ERROR: not found")

io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
