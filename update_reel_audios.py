import asyncio
import edge_tts
import json
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def generate_scene(text, output_mp3, voice='es-CL-LorenzoNeural', rate='+8%'):
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    
    with open(output_mp3, 'wb') as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "word": chunk["text"],
                    "offset_ms": chunk["offset"] / 10000,
                    "duration_ms": chunk["duration"] / 10000
                })
                
    # Calculate frames at 30 fps
    fps = 30
    for w in words:
        w["start_frame"] = int(round((w["offset_ms"] / 1000.0) * fps))
        w["duration_frames"] = max(1, int(round((w["duration_ms"] / 1000.0) * fps)))
        
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', output_mp3]
    dur_str = subprocess.check_output(cmd).decode().strip()
    dur_sec = float(dur_str)
    dur_frames = int(round(dur_sec * fps)) + 6
    
    return {
        "text": text,
        "dur_sec": dur_sec,
        "dur_frames": dur_frames,
        "words": words
    }

async def main():
    print("🎙️ Regenerando audios para escena de acero en 3mm...")
    
    # 1. Reel Legal (Reel 01)
    t1 = "Fabricada en tubo de acero reforzado de tres milímetros y desarmable en tres partes compactas."
    res1 = await generate_scene(t1, "public/audio/reel_legal/scene3_acero.mp3")
    print("\n--- REEL LEGAL (Scene 3) ---")
    print(f"Duración: {res1['dur_sec']:.2f}s ({res1['dur_frames']} frames)")
    for w in res1['words']:
        print(f"  {w['word']}: start_frame={w['start_frame']}, dur={w['duration_frames']}")
        
    # 2. Reel 02 (Gancho viral / Prueba de tiron)
    t2 = "Tubo de acero reforzado de tres milímetros y pasadores de seguridad. Se arma en un minuto."
    res2 = await generate_scene(t2, "public/audio/reel_02/scene3_acero.mp3")
    print("\n--- REEL 02 (Scene 3) ---")
    print(f"Duración: {res2['dur_sec']:.2f}s ({res2['dur_frames']} frames)")
    for w in res2['words']:
        print(f"  {w['word']}: start_frame={w['start_frame']}, dur={w['duration_frames']}")
        
    # Guardar resultados
    with open("public/audio/reel_legal/scene3_words_3mm.json", "w", encoding="utf-8") as f:
        json.dump(res1, f, indent=2, ensure_ascii=False)
    with open("public/audio/reel_02/scene3_words_3mm.json", "w", encoding="utf-8") as f:
        json.dump(res2, f, indent=2, ensure_ascii=False)
        
    print("\n✅ Audios y transcripciones generados con éxito.")

if __name__ == "__main__":
    asyncio.run(main())
