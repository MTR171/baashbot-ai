import os
import json
import random
import re
from typing import List, Optional
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="BaashBot AI Backend", version="2.0.0")

# CORS configuration for Vercel frontend & local dev
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allow_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

GAMES = ["sorry_button", "dodge_baash", "apology_type", "whack_troll", "balance_baash"]


class HistoryItem(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: List[HistoryItem] = Field(default_factory=list)
    language: str = "bn"
    current_annoyance: int = 5
    victim: str = ""
    offense: str = ""


class ChatResponse(BaseModel):
    reply: str
    victim: str
    offense: str
    annoyance: int
    ready_for_game: bool
    suggested_game: Optional[str] = None
    mood: str = "mischievous"
    source: str = "ai"


class RoastRequest(BaseModel):
    victim: str = "দোষী"
    offense: str = "অপরাধ"
    tier: int = 1
    game_id: str = "sorry_button"
    fails: int = 0
    language: str = "bn"


SYSTEM_PROMPT = """You are BaashBot AI (বাঁশ-বট AI), a hilarious, witty, mischievous Bangladeshi fun chatbot that helps the user design a lighthearted, harmless mini-game punishment for a friend/partner/sibling who annoyed them.
Rules:
1. Keep everything playful, friendly, safe, and funny — zero real harm, zero hate speech, zero abuse.
2. Talk naturally like a cheeky Bangladeshi best friend in Bengali (or English if user speaks English). Keep replies short (1-3 punchy sentences) because they will be spoken aloud via voice!
3. Your goal in 1-3 exchanges is to figure out:
   - victim: who annoyed the user (name or relation like "আমার বন্ধু", "রাহাত", etc.)
   - offense: what they did (e.g., "রিপ্লাই দেয় না", "ট্রিট দেয় নাই", "লেট করে আসছে")
   - annoyance: integer 1 to 10 based on how annoyed the user sounds
4. Once you know the offense (or if the user explicitly asks to start/make the game/give punishment), set ready_for_game to true and tease that the Baash Roulette is ready!
5. ALWAYS respond ONLY with valid raw JSON matching this schema (no markdown fences):
{
  "reply": "Short witty voice-friendly response",
  "victim": "extracted name or previous value",
  "offense": "short summary of what they did",
  "annoyance": 7,
  "ready_for_game": false,
  "suggested_game": "sorry_button | dodge_baash | apology_type | whack_troll | balance_baash",
  "mood": "mischievous | laughing | shocked | evil_genius"
}
"""


def fallback_chat(req: ChatRequest) -> ChatResponse:
    msg = req.message.strip()
    lower = msg.lower()
    victim = req.victim or ""
    offense = req.offense or ""
    annoyance = max(1, min(10, req.current_annoyance))

    # Extract explicit number 1-10 if user mentions rage/level
    num_match = re.search(r"\b(10|[1-9])\b", msg)
    if num_match:
        annoyance = int(num_match.group(1))
    else:
        intense_words = ["অনেক", "খুব", "চরম", "মেজাজ", "ফাটছে", "জ্বলছে", "বিরক্ত", "rag", "angry", "very", "super", "100", "বাঁশ"]
        mild_words = ["একটু", "হালকা", "মজা", "little", "bit", "fun"]
        if any(w in lower for w in intense_words):
            annoyance = min(10, max(annoyance, 8))
        elif any(w in lower for w in mild_words):
            annoyance = max(3, min(annoyance, 5))

    # Detect victim hints
    if not victim:
        if any(w in lower for w in ["বন্ধু", "friend", "bondhu", "dost", "frnd"]):
            victim = "প্রিয় বন্ধু"
        elif any(w in lower for w in ["বোন", "sister", "bon"]):
            victim = "দুষ্টু বোন"
        elif any(w in lower for w in ["ভাই", "brother", "bhai"]):
            victim = "ভাই ব্রাদার"
        elif any(w in lower for w in ["gf", "bf", "গার্লফ্রেন্ড", "বয়ফ্রেন্ড", "পাগলী", "পাগল"]):
            victim = "স্পেশাল মানুষ"
        else:
            words = msg.split()
            if len(words) <= 3 and len(msg) >= 2:
                victim = msg

    if not offense and len(msg) > 6:
        offense = msg[:60]

    trigger_words = ["শুরু", "গেম", "শাস্তি", "বাঁশ", "বানাও", "দাও", "start", "game", "punish", "ready", "রুলেট"]
    wants_start = any(w in lower for w in trigger_words)
    turn_count = len(req.history) // 2

    ready = bool(wants_start or (offense and turn_count >= 1) or turn_count >= 2)
    if not victim:
        victim = "অপরাধী"
    if not offense:
        offense = "কারণ ছাড়াই বিরক্ত করা"

    if req.language == "en":
        if ready:
            reply = f"Oh, {victim} really messed up! Rage level {annoyance}/10 locked in. Spin the Baash Roulette and let the punishment begin!"
        else:
            reply = f"Haha, spill the tea! On a scale of 1 to 10, how annoyed are you with {victim} right now? I'm cooking up a brutal mini-game!"
    else:
        if ready:
            replies = [
                f"ওহহো! {victim}-এর কপালে আজকে শনি আছে! বিরক্তি লেভেল {annoyance}/10 লক করলাম। নিচের 'বাঁশ রুলেট ঘোরাও' বাটনে চাপ দাও, খেলা শুরু!",
                f"এই অপরাধের কোনো মাফ নাই! {victim}-এর জন্য লেভেল {annoyance}/10 স্পেশাল বাঁশ রেডি। রুলেট ঘুরিয়ে শাস্তি লক করো!",
            ]
            reply = random.choice(replies)
        else:
            replies = [
                f"হাহা, পুরো কেসটা জমছে! বলো তো ১ থেকে ১০-এর মধ্যে {victim}-এর ওপর মেজাজ কতটা গরম? সেই অনুযায়ী বাঁশ মাপবো!",
                f"আরে বাপরে! তা এই {victim}-এর ওপর রাগ ১ থেকে ১০-এ কত? বলে দাও, একদম কড়কড়ে একটা র‍্যান্ডম গেম বানায় দিচ্ছি!",
            ]
            reply = random.choice(replies)

    return ChatResponse(
        reply=reply,
        victim=victim,
        offense=offense,
        annoyance=annoyance,
        ready_for_game=ready,
        suggested_game=random.choice(GAMES),
        mood="evil_genius" if ready else "mischievous",
        source="fallback",
    )


async def call_gemini_json(prompt_text: str) -> Optional[dict]:
    if not GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.9,
            "responseMimeType": "application/json",
        },
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                return None
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = text.strip()
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
            return json.loads(text)
    except Exception:
        return None


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "BaashBot AI Backend",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        return fallback_chat(req)

    history_lines = "\n".join(
        f"{'User' if h.role == 'user' else 'BaashBot'}: {h.text}" for h in req.history[-8:]
    )
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Current state -> language: {req.language}, victim: '{req.victim}', offense: '{req.offense}', annoyance: {req.current_annoyance}/10\n"
        f"Conversation so far:\n{history_lines}\n"
        f"User just said: {req.message}\n"
        f"Respond with JSON only."
    )
    parsed = await call_gemini_json(prompt)
    if not parsed or "reply" not in parsed:
        return fallback_chat(req)

    try:
        annoyance = int(parsed.get("annoyance", req.current_annoyance))
    except Exception:
        annoyance = req.current_annoyance
    annoyance = max(1, min(10, annoyance))

    suggested = parsed.get("suggested_game")
    if suggested not in GAMES:
        suggested = random.choice(GAMES)

    return ChatResponse(
        reply=str(parsed.get("reply", "")).strip() or fallback_chat(req).reply,
        victim=str(parsed.get("victim") or req.victim or "অপরাধী")[:40],
        offense=str(parsed.get("offense") or req.offense or "দুষ্টুমি করা")[:80],
        annoyance=annoyance,
        ready_for_game=bool(parsed.get("ready_for_game", False)),
        suggested_game=suggested,
        mood=str(parsed.get("mood", "mischievous")),
        source="gemini",
    )


@app.post("/api/roast")
async def roast(req: RoastRequest):
    fallback_bn = {
        1: [
            f"কীরে {req.victim}, এত সহজটাও পারছিস না? হাত কি কাঁপছে নাকি!",
            "আরে বাবা, একটু ফাস্ট হ! এই স্পিডে তো কাল সকাল হয়ে যাবে!",
        ],
        2: [
            f"টিয়ার ২ আনলক! {req.victim}, এবার একটু ঘাম ঝরবে — গেম আরও হার্ড হয়ে গেল!",
            "হাহা! দেরি করবি আর বাঁশ বড় হবে, এটাই নিয়ম!",
        ],
        3: [
            f"টিয়ার ৩ মেগা বাঁশ! {req.victim}, কানের নিচে ঘাম জমতেছে নাকি?",
            "এখনো শেষ করতে পারলি না? স্পিড ডাবল করে দিলাম!",
        ],
        4: [
            f"আল্ট্রা প্রো ম্যাক্স বাঁশ অ্যাক্টিভেটেড! {req.victim}, আজকে আর মুক্তি নাই!",
            "সর্বোচ্চ লেভেলের বাঁশ! এখন জিততে পারলে তোকে সালাম দিবো!",
        ],
    }
    fallback_en = {
        1: [f"Come on {req.victim}, even a sleepy turtle is faster than that!"],
        2: [f"Tier 2 unlocked! Speeding things up for {req.victim}!"],
        3: [f"Tier 3 Mega Baash! Sweating yet, {req.victim}?"],
        4: [f"ULTRA PRO MAX BAASH! Good luck surviving this, {req.victim}!"],
    }

    tier = max(1, min(4, req.tier))
    if GEMINI_API_KEY:
        lang_label = "Bengali" if req.language == "bn" else "English"
        prompt = (
            f"Generate ONE short (max 15 words), hilarious, friendly teasing line in {lang_label} "
            f"for a punishment mini-game. Player name: {req.victim}, offense: {req.offense}, "
            f"difficulty tier: {tier}/4, fails so far: {req.fails}. "
            f"Return JSON only: {{\"roast\": \"...\"}}"
        )
        parsed = await call_gemini_json(prompt)
        if parsed and parsed.get("roast"):
            return {"roast": str(parsed["roast"]).strip(), "source": "gemini"}

    pool = fallback_bn[tier] if req.language == "bn" else fallback_en[tier]
    return {"roast": random.choice(pool), "source": "fallback"}
