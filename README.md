# DeepBlockAI Dashboard

Punto central de datos para los bots de DeepBlockAI.

Todos los bots escriben sus resultados en `data/<bot-name>.json` usando `writer.save_bot_payload(...)`.

Estos JSON se reutilizan para:
- Dashboard web
- Bots agregadores (crypto-tools-publisher)
- Scripts de análisis o reportes
