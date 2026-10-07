import asyncio
import os
import json
import subprocess
import edge_tts

async def generate_script():
    os.makedirs('public/audio/reel_legal', exist_ok=True)
    voice = 'es-CL-LorenzoNeural'
    rate = '+8%'
    
    scenes = [
        {
            'id': 'scene1_hook',
            'text': '¿Sabías que remolcar con cuerda o piola es multa grave en Chile?',
            'chunks': [
                {'text': '¿SABÍAS ESTO?', 'highlight': 'ESTO', 'color': '#FFE500', 'ratio': (0.0, 0.28)},
                {'text': 'REMOLCAR CON PIOLA', 'highlight': 'PIOLA', 'color': '#FFFFFF', 'ratio': (0.28, 0.60)},
                {'text': '¡ES MULTA GRAVE!', 'highlight': 'MULTA', 'color': '#FF3B30', 'ratio': (0.60, 1.0)}
            ]
        },
        {
            'id': 'scene2_ley',
            'text': 'El Ministerio de Transportes exige acople rígido para evitar choques por alcance.',
            'chunks': [
                {'text': 'LEY DE TRÁNSITO CHILE', 'highlight': 'CHILE', 'color': '#00E5FF', 'ratio': (0.0, 0.32)},
                {'text': 'DECRETO N° 55 MTT', 'highlight': '55', 'color': '#FFFFFF', 'ratio': (0.32, 0.65)},
                {'text': 'ENGANCHE RÍGIDO OBLIGATORIO', 'highlight': 'OBLIGATORIO', 'color': '#00FF66', 'ratio': (0.65, 1.0)}
            ]
        },
        {
            'id': 'scene3_acero',
            'text': 'Fabricada en tubo de acero reforzado de tres milímetros y desarmable en tres partes compactas.',
            'chunks': [
                {'text': 'TUBO ACERO 3 MM', 'highlight': '3', 'color': '#00E5FF', 'ratio': (0.0, 0.35)},
                {'text': '3 TRAMOS COMPACTOS', 'highlight': 'COMPACTOS', 'color': '#FFE500', 'ratio': (0.35, 0.68)},
                {'text': 'CABE EN TU MALETERO', 'highlight': 'MALETERO', 'color': '#00FF66', 'ratio': (0.68, 1.0)}
            ]
        },
        {
            'id': 'scene4_resistencia',
            'text': 'Súper liviana para manipular, pero soporta hasta tres mil quinientos kilos de arrastre.',
            'chunks': [
                {'text': 'SÚPER LIVIANA EN MANO', 'highlight': 'LIVIANA', 'color': '#00E5FF', 'ratio': (0.0, 0.38)},
                {'text': 'PERO SOPORTA', 'highlight': 'SOPORTA', 'color': '#FFFFFF', 'ratio': (0.38, 0.60)},
                {'text': '¡HASTA 3.500 KILOS!', 'highlight': '3.500', 'color': '#FFE500', 'ratio': (0.60, 1.0)}
            ]
        },
        {
            'id': 'scene5_seguridad',
            'text': 'Mantiene distancia fija de uno punto ocho metros, sin tirones bruscos ni riesgo de choque.',
            'chunks': [
                {'text': 'DISTANCIA FIJA 1.8 M', 'highlight': '1.8', 'color': '#00FF66', 'ratio': (0.0, 0.35)},
                {'text': 'SIN TIRONES BRUSCOS', 'highlight': 'TIRONES', 'color': '#FFE500', 'ratio': (0.35, 0.68)},
                {'text': '¡CERO CHOQUES EN RUTA!', 'highlight': 'CERO', 'color': '#FF3B30', 'ratio': (0.68, 1.0)}
            ]
        },
        {
            'id': 'scene6_cierre',
            'text': 'Cumple la ley y viaja seguro por sesenta y cinco mil pesos. Pídela hoy en Metal Creativo.',
            'chunks': []
        }
    ]
    
    manifest = []
    current_frame = 0
    fps = 30
    
    for sc in scenes:
        file_path = f'public/audio/reel_legal/{sc["id"]}.mp3'
        comm = edge_tts.Communicate(sc['text'], voice, rate=rate)
        await comm.save(file_path)
        
        cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path]
        dur_str = subprocess.check_output(cmd).decode().strip()
        dur_sec = float(dur_str)
        # Add 6 frames padding so the audio never clips before the cut
        dur_frames = int(round(dur_sec * fps)) + 6
        
        scene_manifest = {
            'id': sc['id'],
            'file': f'audio/reel_legal/{sc["id"]}.mp3',
            'startFrame': current_frame,
            'durationFrames': dur_frames,
            'durSec': dur_sec,
            'captions': []
        }
        
        for ch in sc['chunks']:
            ch_start = current_frame + int(round(dur_frames * ch['ratio'][0]))
            ch_end = current_frame + int(round(dur_frames * ch['ratio'][1]))
            ch_dur = max(15, ch_end - ch_start)
            scene_manifest['captions'].append({
                'text': ch['text'],
                'highlight': ch['highlight'],
                'color': ch['color'],
                'startFrame': ch_start,
                'durationFrames': ch_dur
            })
            
        manifest.append(scene_manifest)
        current_frame += dur_frames
        
    print(f'Total video frames: {current_frame} ({current_frame/fps:.2f}s)')
    with open('public/audio/reel_legal/manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print('Manifest generated successfully!')

if __name__ == '__main__':
    asyncio.run(generate_script())
