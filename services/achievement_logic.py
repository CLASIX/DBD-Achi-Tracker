from __future__ import annotations

import json
import re
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

ROLE_ORDER = {"killer": 0, "survivor": 1, "general": 2}
OVERRIDES_PATH = Path(__file__).resolve().parent.parent / "data" / "achievement_overrides.json"
CHARACTER_METADATA_PATH = Path(__file__).resolve().parent.parent / "data" / "character_metadata.json"

GENERAL_PATTERNS: list[str] = [
    r"raise a character level",
    r"reach prestige level",
    r"accumulate a total of .* blood points",
    r"boost any perk to level",
    r"raise your grade for the first time",
    r"open at least .* mystery boxes on the bloodweb",
    r"burn a visceral offering",
    r"get more than .* blood points in one scoring category",
    r"complete with at least .* blood points in each score category",
    r"start a public match with a full .* loadout",
]

KILLER_PATTERNS: list[tuple[str, int]] = [
    (r"\bplaying as the\b", 12),
    (r"\bmerciless victory\b", 12),
    (r"\bsacrifice\b", 6),
    (r"\bhook(?:ing|ed)?\b", 5),
    (r"\bdown(?:ed|ing)?\b", 5),
    (r"\binjure(?:d|ing)?\b", 5),
    (r"\bkill(?:ed|ing)?\b", 6),
    (r"\bmori\b", 6),
    (r"\bgrab a survivor\b", 5),
    (r"\bgrab survivors?\b", 5),
    (r"\bhit survivors?\b", 5),
    (r"\bdamage a survivor\b", 6),
    (r"\bdamage survivors?\b", 6),
    (r"\bwhile undetectable\b", 5),
    (r"\bdamage generators?\b", 5),
    (r"\bclose the hatch\b", 5),
    (r"\bkiller instinct\b", 5),
    (r"\boblivious\b", 5),
    (r"\bcarrying another survivor\b", 5),
    (r"\bwhile at least 1 survivor is hooked\b", 5),
    (r"\binterrupt .* survivors?\b", 5),
    (r"\binterrupt a survivor\b", 5),
    (r"\bmake .* survivors? scream\b", 5),
    (r"\bbring the 4 survivors to insanity tier 3\b", 6),
    (r"\breverse bear traps?\b", 6),
    (r"\bbear traps?\b", 6),
    (r"\bblink\b", 5),
    (r"\bhatchets?\b", 6),
    (r"\bshock therapy\b", 6),
    (r"\bdream world\b", 6),
    (r"\blaceration\b", 6),
    (r"\blethal rush\b", 6),
    (r"\bcondemned\b", 6),
    (r"\btail attack\b", 6),
    (r"\bscamper\b", 6),
    (r"\bintestinal whip\b", 6),
    (r"\bimmobilize survivors? to a wall\b", 6),
    (r"\bvine or undergate attacks?\b", 6),
]

SURVIVOR_PATTERNS: list[tuple[str, int]] = [
    (r"\bas a survivor\b", 12),
    (r"\bescape\b", 6),
    (r"\brescue someone\b", 5),
    (r"\bsave .* survivors?\b", 5),
    (r"\bheal(?:ing)? other survivors?\b", 6),
    (r"\bheal others\b", 5),
    (r"\bheal the obsession\b", 5),
    (r"\bhealing actions? on survivors?\b", 6),
    (r"\bheal a total of .* health states\b", 5),
    (r"\bheal them\b", 3),
    (r"\bpositive status effects\b", 5),
    (r"\bdodge basic attacks? or projectiles\b", 5),
    (r"\bcrawl your way out\b", 6),
    (r"\bjump over a pallet or through a window during a chase\b", 6),
    (r"\bwhile the killer is carrying you\b", 6),
    (r"\bwiggle out of the killer'?s grasp\b", 6),
    (r"\breveal the killer'?s aura\b", 6),
    (r"\bsee the killer'?s aura\b", 6),
    (r"\bbe chased by the killer\b", 6),
    (r"\brecover from dying\b", 6),
    (r"\bprotection hit\b", 6),
    (r"\bstun the killer\b", 6),
    (r"\bcleanse(?:d|ing)?\b", 5),
    (r"\bbless(?:ed|ing)?\b", 5),
    (r"\bhex totems?\b", 4),
    (r"\bunhook yourself\b", 6),
    (r"\bunhook\b", 5),
    (r"\brepair(?:ing)?\b", 5),
    (r"\bfinish repairing\b", 6),
    (r"\bunlock .* chests?\b", 5),
    (r"\bswap held survivor items?\b", 5),
    (r"\bblind the killer\b", 6),
    (r"\bcause the killer to miss\b", 6),
    (r"\bhelp other survivors?\b", 5),
    (r"\bhiding inside a locker\b", 4),
    (r"\bopen a chest\b", 4),
    (r"\bhatch\b", 4),
    (r"\bwindow\b", 2),
    (r"\bpallet\b", 2),
    (r"\bflashlight\b", 5),
    (r"\bchests?\b", 3),
    (r"\bitems?\b", 3),
    (r"\bother survivors?\b", 4),
    (r"\bpermanent healing charges\b", 6),
]

CHARACTER_POWER_RULES: list[tuple[str, str]] = [
    (r"\blethal rush\b", "Blight"),
    (r"\blaceration\b", "Trickster"),
    (r"\bcondemned\b", "Onryō"),
    (r"\bhatchets?\b", "Huntress"),
    (r"\bdream world\b", "Nightmare"),
    (r"\bshock therapy\b", "Doctor"),
    (r"\binsanity tier 3\b", "Doctor"),
    (r"\btail attack\b", "Xenomorph"),
    (r"\breverse bear traps?\b", "Pig"),
    (r"\bbear traps?\b", "Trapper"),
    (r"\bblink\b", "Nurse"),
    (r"\bphatasm traps?\b", "Hag"),
    (r"\bphantasm traps?\b", "Hag"),
    (r"\bguard\b", "Knight"),
    (r"\bteleported to\b", "Singularity"),
    (r"\bslam one survivor into another\b", "Mastermind"),
    (r"\bscamper\b", "Good Guy"),
    (r"\bintestinal whip\b", "Krasue"),
    (r"\bimmobilize survivors? to a wall\b", "Slasher"),
    (r"\bvine or undergate attacks?\b", "First"),
]


def read_overrides_file() -> dict[str, dict[str, Any]]:
    if not OVERRIDES_PATH.exists():
        return {}

    try:
        raw = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

    return raw if isinstance(raw, dict) else {}


@lru_cache(maxsize=1)
def load_achievement_overrides() -> dict[str, dict[str, Any]]:
    raw = read_overrides_file()
    normalized: dict[str, dict[str, Any]] = {}
    for name, data in raw.items():
        if isinstance(data, dict):
            normalized[normalize_key(name)] = data
    return normalized


def read_character_metadata_file() -> dict[str, Any]:
    if not CHARACTER_METADATA_PATH.exists():
        return {}

    try:
        raw = json.loads(CHARACTER_METADATA_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

    return raw if isinstance(raw, dict) else {}


@lru_cache(maxsize=1)
def load_character_metadata() -> dict[str, dict[str, Any]]:
    raw = read_character_metadata_file()

    normalized: dict[str, dict[str, Any]] = {}
    for name, data in raw.items():
        if isinstance(data, dict):
            normalized[normalize_key(name)] = {
                "name": name,
                "role": data.get("role", ""),
                "chapter": data.get("chapter", ""),
                "releaseOrder": data.get("releaseOrder"),
            }
    return normalized


def normalize_key(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "", value.lower())
    return cleaned.strip()


def to_int_or_none(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def build_character_catalog(global_achievements: list[dict[str, Any]]) -> dict[str, list[str]]:
    killers: set[str] = set()
    survivors: set[str] = set()

    for achievement in global_achievements:
        name = achievement.get("name", "")
        description = (achievement.get("description") or "").lower()
        if not name.startswith("Adept "):
            continue

        character = name.replace("Adept ", "", 1).strip()
        if "merciless victory" in description:
            killers.add(character)
        elif "escape with" in description:
            survivors.add(character)

    return {
        "killers": sorted(killers, key=lambda item: (-len(item), item.lower())),
        "survivors": sorted(survivors, key=lambda item: (-len(item), item.lower())),
    }


def score_patterns(text: str, patterns: list[tuple[str, int]]) -> int:
    score = 0
    for pattern, weight in patterns:
        if re.search(pattern, text, flags=re.IGNORECASE):
            score += weight
    return score


def is_general_progression(description: str) -> bool:
    return any(re.search(pattern, description, flags=re.IGNORECASE) for pattern in GENERAL_PATTERNS)


def infer_role(name: str, description: str, catalog: dict[str, list[str]]) -> str:
    title_lower = name.lower()
    description_lower = description.lower()
    combined = f"{title_lower} {description_lower}"

    if name.startswith("Adept "):
        character = name.replace("Adept ", "", 1).strip()
        if character in catalog["killers"] or "merciless victory" in description_lower:
            return "killer"
        if character in catalog["survivors"] or "escape with" in description_lower:
            return "survivor"

    if "apt killer" in title_lower or "expert killer" in title_lower or "master killer" in title_lower or "legendary killer" in title_lower:
        return "killer"
    if "apt survivor" in title_lower or "expert survivor" in title_lower or "master survivor" in title_lower or "legendary survivor" in title_lower:
        return "survivor"

    if "as a killer" in combined and "as a survivor" not in combined:
        return "killer"
    if "as a survivor" in combined and "as a killer" not in combined:
        return "survivor"

    if is_general_progression(description_lower):
        return "general"
    if "playing as the " in description_lower:
        return "killer"
    if "playing as " in description_lower and "playing as the " not in description_lower:
        return "survivor"

    for character_name in catalog["killers"]:
        if f"with the {character_name.lower()}" in description_lower or f"as the {character_name.lower()}" in description_lower:
            return "killer"
    for character_name in catalog["survivors"]:
        lowered = character_name.lower()
        survivor_patterns = [f"escape with {lowered}", f"as {lowered},", f"as {lowered} "]
        if any(pattern in description_lower for pattern in survivor_patterns):
            return "survivor"

    killer_score = score_patterns(combined, KILLER_PATTERNS)
    survivor_score = score_patterns(combined, SURVIVOR_PATTERNS)

    if "expert killer" in title_lower or "master killer" in title_lower or "legendary killer" in title_lower:
        killer_score += 10
    if "expert survivor" in title_lower or "master survivor" in title_lower or "legendary survivor" in title_lower:
        survivor_score += 10
    if "apt killer" in title_lower:
        killer_score += 10
    if "apt survivor" in title_lower:
        survivor_score += 10

    if killer_score > survivor_score and killer_score >= 5:
        return "killer"
    if survivor_score > killer_score and survivor_score >= 5:
        return "survivor"

    return "general"


def infer_character(name: str, description: str, role: str, catalog: dict[str, list[str]]) -> str | None:
    if name.startswith("Adept "):
        return name.replace("Adept ", "", 1).strip() or None

    description_lower = description.lower()
    title_lower = name.lower()
    combined = f"{title_lower} {description_lower}"

    for pattern, character in CHARACTER_POWER_RULES:
        if re.search(pattern, combined, flags=re.IGNORECASE):
            return character

    if role == "killer":
        for killer in catalog["killers"]:
            killer_lower = killer.lower()
            patterns = [
                f"playing as the {killer_lower}",
                f"with the {killer_lower}",
                f"as the {killer_lower}",
                f"the {killer_lower}",
            ]
            if any(pattern in description_lower for pattern in patterns) or killer_lower in title_lower:
                return killer

    if role == "survivor":
        for survivor in catalog["survivors"]:
            survivor_lower = survivor.lower()
            patterns = [
                f"escape with {survivor_lower}",
                f"as {survivor_lower},",
                f"as {survivor_lower} ",
                f"with {survivor_lower}",
            ]
            if any(pattern in description_lower for pattern in patterns):
                return survivor

    return None


def lookup_character_metadata(character: str | None) -> dict[str, Any] | None:
    if not character:
        return None
    return load_character_metadata().get(normalize_key(character))


def refresh_metadata_caches() -> None:
    load_achievement_overrides.cache_clear()
    load_character_metadata.cache_clear()


def upsert_achievement_override(name: str, payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    name = (name or "").strip()
    if not name:
        raise ValueError("Achievement name is required.")

    existing = read_overrides_file()
    cleaned: dict[str, Any] = {}
    for key in ("role", "character", "chapter", "description"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            cleaned[key] = value.strip()

    release_order = payload.get("releaseOrder")
    if release_order not in (None, ""):
        try:
            cleaned["releaseOrder"] = int(release_order)
        except (TypeError, ValueError) as exc:
            raise ValueError("Release order must be a number.") from exc

    if cleaned:
        existing[name] = cleaned
    else:
        existing.pop(name, None)

    OVERRIDES_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
    refresh_metadata_caches()
    return existing


def delete_achievement_override(name: str) -> dict[str, dict[str, Any]]:
    existing = read_overrides_file()
    existing.pop((name or "").strip(), None)
    OVERRIDES_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
    refresh_metadata_caches()
    return existing


def merge_achievements(
    global_achievements: list[dict[str, Any]], personal_achievements: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    catalog = build_character_catalog(global_achievements)
    overrides = load_achievement_overrides()
    unlocked_by_key = {normalize_key(item.get("name", "")): item for item in personal_achievements}
    merged: list[dict[str, Any]] = []

    for achievement in global_achievements:
        name = achievement.get("name", "")
        key = normalize_key(name)
        override = overrides.get(key, {})
        personal_match = unlocked_by_key.get(key)
        description = override.get("description") or achievement.get("description", "")
        role = override.get("role") or infer_role(name, description, catalog)
        character = override.get("character") or infer_character(name, description, role, catalog)
        character_meta = lookup_character_metadata(character)
        chapter = override.get("chapter") or (character_meta.get("chapter") if character_meta else "")
        release_order = to_int_or_none(override.get("releaseOrder"))
        if release_order is None and character_meta:
            release_order = to_int_or_none(character_meta.get("releaseOrder"))

        is_adept = name.startswith("Adept ")
        unlocked = bool(personal_match and personal_match.get("unlocked"))

        merged.append(
            {
                "name": name,
                "description": description,
                "icon": personal_match.get("icon") if personal_match else achievement.get("icon", ""),
                "globalPercent": achievement.get("globalPercent"),
                "role": role,
                "character": character or "",
                "chapter": chapter,
                "releaseOrder": release_order,
                "isAdept": is_adept,
                "unlocked": unlocked,
                "unlockDate": personal_match.get("unlockDate") if personal_match else None,
                "unlockDisplay": personal_match.get("unlockDisplay") if personal_match else None,
                "progressDisplay": personal_match.get("progressDisplay") if personal_match else None,
                "sortRoleOrder": ROLE_ORDER.get(role, 99),
            }
        )

    return merged


def build_summary(achievements: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(achievements)
    unlocked = sum(1 for achievement in achievements if achievement.get("unlocked"))
    locked = total - unlocked

    role_totals = {"killer": 0, "survivor": 0, "general": 0}
    role_unlocked = {"killer": 0, "survivor": 0, "general": 0}

    for achievement in achievements:
        role = achievement.get("role", "general")
        role_totals[role] = role_totals.get(role, 0) + 1
        if achievement.get("unlocked"):
            role_unlocked[role] = role_unlocked.get(role, 0) + 1

    adept_total = sum(1 for achievement in achievements if achievement.get("isAdept"))
    adept_unlocked = sum(1 for achievement in achievements if achievement.get("isAdept") and achievement.get("unlocked"))

    return {
        "total": total,
        "unlocked": unlocked,
        "locked": locked,
        "completionPercent": round((unlocked / total) * 100, 1) if total else 0,
        "adept": {"total": adept_total, "unlocked": adept_unlocked, "locked": adept_total - adept_unlocked},
        "roles": {
            role: {
                "total": role_totals.get(role, 0),
                "unlocked": role_unlocked.get(role, 0),
                "locked": role_totals.get(role, 0) - role_unlocked.get(role, 0),
            }
            for role in ("killer", "survivor", "general")
        },
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    }
