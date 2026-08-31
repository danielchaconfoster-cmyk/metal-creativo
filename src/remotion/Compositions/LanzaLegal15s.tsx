import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const LanzaLegal15s: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso del video en la parte inferior
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// --- ANIMACIONES ESCENA 1 (0 a 110 frames / 0 - 3.6s) ---
	const scaleScene1 = interpolate(frame, [0, 110], [1.0, 1.15], {
		extrapolateRight: 'clamp',
	});
	const springTitle1 = spring({
		frame,
		fps,
		config: { damping: 10, mass: 0.5 },
	});

	// --- ANIMACIONES ESCENA 2 (100 a 240 frames / 3.3 - 8s) ---
	const opacityScene2 = interpolate(frame, [100, 120], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scaleScene2 = interpolate(frame, [100, 240], [1.12, 1.0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const springTitle2 = spring({
		frame: frame - 105,
		fps,
		config: { damping: 12, mass: 0.6 },
	});

	// --- ANIMACIONES ESCENA 3 (230 a 350 frames / 7.6 - 11.6s) ---
	const opacityScene3 = interpolate(frame, [230, 250], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scaleScene3 = interpolate(frame, [230, 350], [1.0, 1.15], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const springTitle3 = spring({
		frame: frame - 235,
		fps,
		config: { damping: 12, mass: 0.6 },
	});

	// --- ANIMACIONES ESCENA 4 (340 a 450 frames / 11.3 - 15s) ---
	const opacityScene4 = interpolate(frame, [340, 360], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const springCta = spring({
		frame: frame - 350,
		fps,
		config: { damping: 9, mass: 0.5 },
	});
	const pulseCta = Math.sin((frame - 350) * 0.18) * 0.04 + 1;

	return (
		<AbsoluteFill style={{ backgroundColor: '#090b10', fontFamily: 'Montserrat, Syncopate, sans-serif' }}>
			{/* IMPORTACIÓN DE TIPOGRAFÍAS GOOGLE FONTS DE IMPACTO METÁLICO */}
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Syncopate:wght@700;800&display=swap');

					.text-chrome-3d {
						font-family: 'Syncopate', sans-serif;
						font-weight: 800;
						background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 35%, #94A3B8 50%, #475569 65%, #1E293B 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.95));
						text-shadow: 
							0 1px 0 #CBD5E1,
							0 2px 0 #94A3B8,
							0 3px 0 #64748B,
							0 4px 0 #475569,
							0 5px 0 #334155,
							0 8px 25px rgba(0,0,0,0.9);
					}

					.text-red-chrome-3d {
						font-family: 'Syncopate', sans-serif;
						font-weight: 800;
						background: linear-gradient(180deg, #FFFFFF 0%, #FF8A8A 30%, #EF4444 50%, #991B1B 70%, #450A0A 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						filter: drop-shadow(0px 10px 20px rgba(220,38,38,0.8));
						text-shadow: 
							0 1px 0 #FCA5A5,
							0 2px 0 #EF4444,
							0 3px 0 #DC2626,
							0 4px 0 #991B1B,
							0 6px 20px rgba(0,0,0,0.9);
					}

					.text-gold-3d {
						font-family: 'Montserrat', sans-serif;
						font-weight: 900;
						background: linear-gradient(180deg, #FFF 0%, #FDE047 35%, #EAB308 55%, #CA8A04 75%, #713F12 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.9));
					}
				`}
			</style>

			{/* PISTA DE MÚSICA DE FONDO SYNCD */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.8} />

			{/* ================= ESCENA 1: EL HOOK LEGAL SIN CAJAS (0 - 110) ================= */}
			<Sequence from={0} durationInFrames={110}>
				<AbsoluteFill style={{ overflow: 'hidden' }}>
					<Img
						src={staticFile('images/rope_hook.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleScene1})`,
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.15) 50%, rgba(9,11,16,0.9) 100%)',
						}}
					/>
					
					{/* TÍTULO LIBRE METÁLICO 3D SIN CAJAS */}
					<div
						style={{
							position: 'absolute',
							top: 180,
							left: 30,
							right: 30,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transform: `scale(${springTitle1})`,
						}}
					>
						<div
							className="text-red-chrome-3d"
							style={{
								fontSize: 54,
								textAlign: 'center',
								lineHeight: 1.1,
								letterSpacing: 2,
							}}
						>
							PROHIBIDO POR LEY
						</div>

						<div
							className="text-gold-3d"
							style={{
								marginTop: 30,
								fontSize: 34,
								textAlign: 'center',
								letterSpacing: 1,
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							REMOLCAR CON PIOLA O CUERDA ES ILEGAL EN CHILE ⚠️
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: DECRETO SUPREMO 55/2025 MTT LIBRE (100 - 240) ================= */}
			<Sequence from={100} durationInFrames={140}>
				<AbsoluteFill style={{ opacity: opacityScene2, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_carretera.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleScene2})`,
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.2) 50%, rgba(9,11,16,0.92) 100%)',
						}}
					/>

					{/* TEXTOS METÁLICOS 3D LIBRES SIN CAJAS */}
					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 30,
							right: 30,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transform: `scale(${springTitle2})`,
						}}
					>
						<div
							style={{
								color: '#38bdf8',
								fontSize: 24,
								fontWeight: 900,
								letterSpacing: 4,
								textTransform: 'uppercase',
								textShadow: '0 2px 10px rgba(0,0,0,0.9)',
							}}
						>
							🇨🇱 GOBIERNO DE CHILE • MTT
						</div>

						<div
							className="text-chrome-3d"
							style={{
								fontSize: 48,
								textAlign: 'center',
								lineHeight: 1.15,
								marginTop: 16,
							}}
						>
							DECRETO SUPREMO N° 55/2025
						</div>

						<div
							style={{
								fontSize: 30,
								fontWeight: 900,
								color: '#ffffff',
								textAlign: 'center',
								marginTop: 20,
								textShadow: '0 4px 20px rgba(0,0,0,0.9)',
								lineHeight: 1.3,
							}}
						>
							EXIGE <span style={{ color: '#ffb300' }}>ACOPLE METÁLICO RÍGIDO</span> ENTRE VEHÍCULOS
						</div>
					</div>

					{/* TEXTO DE MARCA LIBRE ABAJO */}
					<div
						style={{
							position: 'absolute',
							bottom: 160,
							left: 30,
							right: 30,
							textAlign: 'center',
						}}
					>
						<div className="text-gold-3d" style={{ fontSize: 38 }}>
							LANZA RÍGIDA DE REMOLQUE
						</div>
						<div
							style={{
								fontSize: 26,
								fontWeight: 800,
								color: '#ffffff',
								marginTop: 8,
								textShadow: '0 4px 15px rgba(0,0,0,0.9)',
							}}
						>
							Acero Macizo de Maestranza Chilena
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: CALIDAD Y PASADOR LIBRE (230 - 350) ================= */}
			<Sequence from={230} durationInFrames={120}>
				<AbsoluteFill style={{ opacity: opacityScene3, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_pasador.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleScene3})`,
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.85) 0%, rgba(9,11,16,0.2) 40%, rgba(9,11,16,0.9) 100%)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: 160,
							left: 30,
							right: 30,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transform: `scale(${springTitle3})`,
						}}
					>
						<div className="text-chrome-3d" style={{ fontSize: 44, textAlign: 'center' }}>
							INGENIERÍA EN ACERO
						</div>

						<div
							style={{
								marginTop: 30,
								display: 'flex',
								flexDirection: 'column',
								gap: 16,
								alignItems: 'center',
							}}
						>
							<div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff', textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
								⚙️ OJALES FORJADOS EN ACERO
							</div>
							<div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff', textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
								⚙️ PASADORES MECÁNICOS PASANTES
							</div>
							<div className="text-gold-3d" style={{ fontSize: 32 }}>
								⚙️ 3.500 KG ARRASTRE DIRECTO
							</div>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: PRECIO Y CIERRE LIBRE (340 - 450) ================= */}
			<Sequence from={340} durationInFrames={110}>
				<AbsoluteFill style={{ opacity: opacityScene4, overflow: 'hidden' }}>
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
							background: 'linear-gradient(to bottom, rgba(9,11,16,0.92) 0%, rgba(9,11,16,0.6) 40%, rgba(9,11,16,0.95) 100%)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 30,
							right: 30,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<div
							style={{
								fontSize: 34,
								fontWeight: 900,
								color: '#ffffff',
								textShadow: '0 4px 20px rgba(0,0,0,0.9)',
								letterSpacing: 2,
							}}
						>
							🧰 DESMONTABLE EN 3 PARTES
						</div>

						<div
							className="text-red-chrome-3d"
							style={{
								marginTop: 30,
								fontSize: 68,
								textAlign: 'center',
							}}
						>
							$89.900 CLP
						</div>
						
						<div className="text-gold-3d" style={{ fontSize: 30, marginTop: 16 }}>
							📦 DESPACHO RÁPIDO A TODO CHILE
						</div>
					</div>

					{/* BOTÓN LIBRE DE WHATSAPP SIN CAJA PESADA */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 30,
							right: 30,
							display: 'flex',
							justifyContent: 'center',
							transform: `scale(${springCta * pulseCta})`,
						}}
					>
						<div
							style={{
								backgroundColor: '#25D366',
								color: '#ffffff',
								fontSize: 38,
								fontWeight: 900,
								padding: '22px 36px',
								borderRadius: 100,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 16,
								boxShadow: '0 15px 45px rgba(37,211,102,0.85)',
								width: '100%',
								textAlign: 'center',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							📲 PEDIR EN WHATSAPP
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* BARRA DE PROGRESO INFERIOR */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: `${progressWidth}%`,
					height: 10,
					backgroundColor: '#ff6600',
					boxShadow: '0 0 15px #ff6600',
				}}
			/>
		</AbsoluteFill>
	);
};
