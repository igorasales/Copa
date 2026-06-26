# Copa

Site estatico da chave interativa da Copa do Mundo 2026, pronto para deploy no Netlify.

## Rodar localmente

```bash
npm install
npm run build
```

Depois abra `index.html` no navegador ou sirva a pasta com qualquer servidor estatico.

## Deploy no Netlify

1. Conecte o repositorio `igorasales/Copa` no Netlify.
2. Use a branch de producao `main`.
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `.`

O arquivo `netlify.toml` ja contem essas configuracoes.
