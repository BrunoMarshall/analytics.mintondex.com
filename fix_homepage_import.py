import io

f = io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', encoding='utf-8').read()

old = 'import { formatSHMPrice } from "../utils/coingecko";'
new = 'import { formatSHMPrice } from "../utils/coingecko";\nimport TokenIcon from "../components/TokenIcon";'

if old in f:
    f = f.replace(old, new)
    print("added TokenIcon import")
else:
    print("ERROR: not found")

io.open('C:/mintondex/frontend/src/pages/HomePage.tsx', 'w', encoding='utf-8').write(f)
print("saved!")
