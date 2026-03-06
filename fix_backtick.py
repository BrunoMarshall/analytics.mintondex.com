import io

f = io.open('C:/mintondex/frontend/src/graphql/queries.ts', encoding='utf-8').read()
before = f.count('\\`;')
f = f.replace('\\`;', '`;')
after = f.count('\\`;')
io.open('C:/mintondex/frontend/src/graphql/queries.ts', 'w', encoding='utf-8').write(f)
print(f"fixed {before - after} occurrences")
