import asyncio
import edge_tts
import json

async def test_words():
    text = "¿Aguanta el tirón o se dobla? Pusimos a prueba la barra de Metal Creativo."
    voice = "es-MX-JorgeNeural"
    communicate = edge_tts.Communicate(text, voice, rate="+6%")
    words = []
    
    with open("public/audio/test_out.mp3", "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "text": chunk["text"],
                    "offset_ms": chunk["offset"] / 10000,
                    "duration_ms": chunk["duration"] / 10000
                })
    
    print(f"Total words: {len(words)}")
    print(json.dumps(words, indent=2))

if __name__ == "__main__":
    asyncio.run(test_words())
