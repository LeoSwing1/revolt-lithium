with open('scripts/partials.ts', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find the start
start = content.find('return `<header')
print('found start:', start)

# Find the end
end = content.find('</div>`;', start)
print('found end:', end)
if end != -1:
    print('context around end:', repr(content[end-20:end+20]))