import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	Loop,
	OffthreadVideo,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const AnuncioPickupTow: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso inferior discreta
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// --- TRANSICIONES Y CROSSFADES ULTRA SUAVES ---
	// Escena 1: 0 - 90 (0 - 3.0s)
	const spring1 = spring({ frame, fps, config: { damping: 16, mass: 0.8 } });
	const opacity1 = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Escena 2: 80 - 170 (2.6 - 5.6s)
	const opacity2 = interpolate(frame, [80, 100, 150, 170], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring2 = spring({ frame: frame - 85, fps, config: { damping: 16, mass: 0.8 } });

	// Escena 3: 160 - 260 (5.3 - 8.6s) -> LANZA RÍGIDA DE 1.8 METROS EN CARRETERA
	const opacity3 = interpolate(frame, [160, 180, 240, 260], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring3 = spring({ frame: frame - 165, fps, config: { damping: 16, mass: 0.8 } });

	// Escena 4: 250 - 350 (8.3 - 11.6s) -> DEMOSTRACIÓN EN VIDEO REAL
	const opacity4 = interpolate(frame, [250, 270, 330, 350], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring4 = spring({ frame: frame - 255, fps, config: { damping: 16, mass: 0.8 } });

	// Escena 5: 340 - 450 (11.3 - 15.0s) -> ESCENA FINAL DE CIERRE Y COTIZAR
	const opacity5 = interpolate(frame, [340, 360], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring5 = spring({ frame: frame - 345, fps, config: { damping: 16, mass: 0.8 } });

	return (
		<AbsoluteFill style={{ backgroundColor: '#090b10', fontFamily: 'Montserrat, sans-serif' }}>
			{/* ESTILO SILVER 3D CHROME EXACTO AL EJEMPLO SIN NEÓN */}
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');

					.text-silver-3d {
						font-family: 'Montserrat', sans-serif;
						font-weight: 900;
						letter-spacing: 2px;
						background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 22%, #CBD5E1 45%, #64748B 50%, #334155 78%, #0F172A 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						filter: drop-shadow(0px 8px 18px rgba(0,0,0,0.95));
						text-shadow: 
							0 1px 0 #E2E8F0,
							0 2px 0 #CBD5E1,
							0 3px 0 #94A3B8,
							0 4px 0 #64748B,
							0 5px 0 #475569,
							0 6px 0 #334155,
							0 10px 25px rgba(0,0,0,0.95);
					}

					.text-red-silver-3d {
						font-family: 'Montserrat', sans-serif;
						font-weight: 900;
						letter-spacing: 2px;
						background: linear-gradient(180deg, #FFFFFF 0%, #FCA5A5 22%, #EF4444 45%, #B91C1C 50%, #7F1D1D 78%, #450A0A 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						filter: drop-shadow(0px 8px 18px rgba(0,0,0,0.95));
						text-shadow: 
							0 1px 0 #FCA5A5,
							0 2px 0 #EF4444,
							0 3px 0 #DC2626,
							0 4px 0 #991B1B,
							0 5px 0 #7F1D1D,
							0 10px 25px rgba(0,0,0,0.95);
					}
				`}
			</style>

			{/* MÚSICA DE FONDO SYNCD */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.8} />

			{/* LOGO OFICIAL DE METAL CREATIVO PERSISTENTE EN LA ESQUINA SUPERIOR DERECHA (DESPEJADO DE TODO TEXTO) */}
			<div
				style={{
					position: 'absolute',
					top: 50,
					right: 45,
					zIndex: 200,
					filter: 'drop-shadow(0 6px 15px rgba(0,0,0,0.9))',
				}}
			>
				<Img
					src={staticFile('images/logo_metal_creativo.png')}
					style={{ width: 170, height: 'auto' }}
				/>
			</div>

			{/* ================= ESCENA 1: LA CUERDA ROTA (0 - 90 frames / 0 - 3.0s) ================= */}
			<Sequence from={0} durationInFrames={90}>
				<AbsoluteFill style={{ opacity: opacity1, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/rope_hook.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.1) 45%, rgba(9,11,16,0.9) 100%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 45,
							right: 230,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							transform: `scale(${spring1})`,
						}}
					>
						<div
							className="text-red-silver-3d"
							style={{
								fontSize: 52,
								lineHeight: 1.1,
								textAlign: 'left',
							}}
						>
							¡PROHIBIDO POR LEY!
						</div>

						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffffff',
								marginTop: 14,
								textAlign: 'left',
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Remolcar con cuerda o piola es ilegal en Chile
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: CARABINEROS / FISCALIZACIÓN EN CARRETERA (80 - 170 frames / 2.6 - 5.6s) ================= */}
			<Sequence from={80} durationInFrames={90}>
				<AbsoluteFill style={{ opacity: opacity2, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/carabineros_inspection.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.1) 45%, rgba(9,11,16,0.9) 100%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 45,
							right: 230,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							transform: `scale(${spring2})`,
						}}
					>
						<div
							className="text-silver-3d"
							style={{
								fontSize: 48,
								lineHeight: 1.1,
								textAlign: 'left',
							}}
						>
							DECRETO SUPREMO N° 55/2025
						</div>

						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffcc00',
								marginTop: 14,
								textAlign: 'left',
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Evita multas graves e inmovilización
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: LANZA RÍGIDA 1.8m EN RUTA 5 NORTE (160 - 260 frames / 5.3 - 8.6s) ================= */}
			<Sequence from={160} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity3, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_ruta5.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.1) 45%, rgba(9,11,16,0.9) 100%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 45,
							right: 230,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							transform: `scale(${spring3})`,
						}}
					>
						<div
							className="text-silver-3d"
							style={{
								fontSize: 48,
								lineHeight: 1.1,
								textAlign: 'left',
							}}
						>
							LANZA RÍGIDA 1.8 METROS
						</div>

						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffffff',
								marginTop: 14,
								textAlign: 'left',
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Acero Macizo • Arrastra hasta 3.500 kg
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: DEMOSTRACIÓN EN VIDEO PICKUP TOWING (250 - 350 frames / 8.3 - 11.6s) ================= */}
			<Sequence from={250} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity4, overflow: 'hidden' }}>
					<Loop durationInFrames={90}>
						<OffthreadVideo
							src={staticFile('videos/pickup_tow.mp4')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
					</Loop>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.15) 45%, rgba(9,11,16,0.9) 100%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 45,
							right: 230,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							transform: `scale(${spring4})`,
						}}
					>
						<div
							className="text-silver-3d"
							style={{
								fontSize: 48,
								lineHeight: 1.1,
								textAlign: 'left',
							}}
						>
							DEMOSTRACIÓN EN RUTA
						</div>

						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffffff',
								marginTop: 14,
								textAlign: 'left',
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Remolque firme y seguro sin choques
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 5: ESCENA FINAL DE CIERRE Y COTIZAR EN WHATSAPP (340 - 450 frames / 11.3 - 15.0s) ================= */}
			<Sequence from={340} durationInFrames={110}>
				<AbsoluteFill style={{ opacity: opacity5, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_maletero.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.92) 0%, rgba(9,11,16,0.65) 45%, rgba(9,11,16,0.95) 100%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 45,
							right: 230,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							transform: `scale(${spring5})`,
						}}
					>
						<div
							className="text-silver-3d"
							style={{
								fontSize: 36,
								textAlign: 'left',
							}}
						>
							🧰 DESMONTABLE EN 3 PARTES
						</div>

						<div
							className="text-red-silver-3d"
							style={{
								marginTop: 16,
								fontSize: 76,
								textAlign: 'left',
							}}
						>
							$65.000 CLP
						</div>

						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffffff',
								marginTop: 10,
								textAlign: 'left',
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Despacho rápido a todo Chile 📦
						</div>
					</div>

					{/* BADGE DE COTIZACIÓN EN WHATSAPP */}
					<div
						style={{
							position: 'absolute',
							bottom: 120,
							left: 45,
							right: 45,
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								backgroundColor: '#1e293b',
								border: '2px solid #25D366',
								color: '#ffffff',
								fontSize: 32,
								fontWeight: 900,
								padding: '20px 32px',
								borderRadius: 16,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 16,
								boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
								width: '100%',
								textAlign: 'center',
								letterSpacing: 1,
							}}
						>
							<span style={{ fontSize: 36 }}>📲</span> COTIZAR POR WHATSAPP (+56 9 5492 2608)
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* BARRA DE PROGRESO INFERIOR DISCRETA */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: `${progressWidth}%`,
					height: 8,
					backgroundColor: '#0288d1',
				}}
			/>
		</AbsoluteFill>
	);
};
