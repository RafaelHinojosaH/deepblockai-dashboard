from pathlib import Path
from datetime import datetime, timezone
import json

# Carpeta donde se guardarán TODOS los JSON de los bots
BASE_PATH = Path.home() / "VP" / "DeepBlockAI" / "deepblockai-dashboard" / "data"
BASE_PATH.mkdir(parents=True, exist_ok=True)


def save_bot_payload(bot_name: str, items, meta: dict | None = None) -> None:
    """
    Guarda la salida de un bot en un JSON estándar:

    {
      "bot": "new-token-explorer",
      "generated_at": "2025-12-04T14:20:00Z",
      "items": [...],
      "meta": {...}
    }
    """
    payload = {
        "bot": bot_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "meta": meta or {},
    }

    out_path = BASE_PATH / f"{bot_name}.json"
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
