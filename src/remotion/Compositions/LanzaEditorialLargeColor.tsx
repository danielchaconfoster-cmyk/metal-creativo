import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
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

export const LanzaEditorialLargeColor: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso discreta
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// --- RITMO Y TIEMPOS CORREGIDOS DE LAS 4 ESCENAS (RITMO PERFECTO DE 15s) ---
	// ESCENA 1: 0 a 90 frames (0 - 3.0s)
	const opacityScene1 = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
	const text1Y = interpolate(frame, [0, 20], [35, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateRight: 'clamp',
	});

	// ESCENA 2: 85 a 180 frames (2.8s - 6.0s)
	const opacityScene2 = interpolate(frame, [85, 98], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text2Y = interpolate(frame, [85, 108], [35, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// ESCENA 3: 175 a 280 frames (5.8s - 9.3s)
	const opacityScene3 = interpolate(frame, [175, 188], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text3Y = interpolate(frame, [175, 195], [35, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// ANIMACIÓN DESFASADA DE LAS 3 TARJETAS DE ESPECIFICACIONES EN LA ESCENA 3
	const card1Y = interpolate(frame - 185, [0, 16], [40, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const card1Opacity = interpolate(frame - 185, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	const card2Y = interpolate(frame - 195, [0, 16], [40, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const card2Opacity = interpolate(frame - 195, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	const card3Y = interpolate(frame - 205, [0, 16], [40, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const card3Opacity = interpolate(frame - 205, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// ESCENA 4: 275 a 450 frames (9.1s - 15.0s) - PRECIO Y CTA INMEDIATO
	const opacityScene4 = interpolate(frame, [275, 288], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text4Y = interpolate(frame, [275, 295], [35, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// El botón de WhatsApp entra INMEDIATAMENTE al segundo 9.5 (frame 285) sin esperas pegadas
	const ctaSpring = spring({
		frame: frame - 285,
		fps,
		config: { damping: 18, stiffness: 220, mass: 0.4 },
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#0A0D14', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@500;700;800&display=swap');

					.font-headline-giant {
						font-family: 'Bebas Neue', sans-serif;
						letter-spacing: 2px;
					}
					.font-body-bold {
						font-family: 'Space Grotesk', sans-serif;
					}
				`}
			</style>

			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.55} />

			{/* CAPA 0: B-ROLL DE VIDEO HD CON LOOP AUTOMATICO */}
			<AbsoluteFill style={{ overflow: 'hidden' }}>
				<Loop durationInFrames={150}>
					<OffthreadVideo
						src={staticFile('videos/pickup_tow.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'brightness(0.4) contrast(1.2)',
						}}
					/>
				</Loop>
				<AbsoluteFill
					style={{
						background: 'linear-gradient(to bottom, rgba(10,13,20,0.92) 0%, rgba(10,13,20,0.3) 45%, rgba(10,13,20,0.95) 100%)',
					}}
				/>
			</AbsoluteFill>

			{/* HEADER DE MARCA DE ALTO CONTRASTE */}
			<div
				style={{
					position: 'absolute',
					top: 50,
					left: 40,
					right: 40,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					zIndex: 50,
					backgroundColor: 'rgba(15,23,42,0.92)',
					padding: '16px 28px',
					borderRadius: 16,
					border: '1px solid rgba(255,255,255,0.15)',
				}}
			>
				<span className="font-headline-giant" style={{ color: '#FFFFFF', fontSize: 36 }}>
					METAL CREATIVO CHILE
				</span>
				<span className="font-body-bold" style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: 16, fontWeight: 800, padding: '6px 16px', borderRadius: 8 }}>
					LEY 2026
				</span>
			</div>

			{/* ================= ESCENA 1: HOOK LEGAL (0 - 90 frames / 0 - 3.0s) ================= */}
			<Sequence from={0} durationInFrames={90}>
				<AbsoluteFill style={{ opacity: opacityScene1, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 40,
							right: 40,
							transform: `translateY(${text1Y}px)`,
						}}
					>
						<div
							style={{
								backgroundColor: '#DC2626',
								color: '#FFFFFF',
								fontSize: 20,
								fontWeight: 800,
								letterSpacing: 3,
								padding: '8px 20px',
								borderRadius: 8,
								display: 'inline-block',
								marginBottom: 16,
								textTransform: 'uppercase',
							}}
						>
							INFRACCIÓN GRAVE DE TRÁNSITO
						</div>

						<h1
							className="font-headline-giant"
							style={{
								color: '#FFFFFF',
								fontSize: 94,
								lineHeight: 0.9,
								margin: 0,
								textTransform: 'uppercase',
								textShadow: '0 4px 20px rgba(0,0,0,0.9)',
							}}
						>
							PROHIBIDO REMOLCAR <br />
							<span style={{ color: '#F59E0B' }}>CON PIOLA O CUERDA</span>
						</h1>
					</div>

					<div
						style={{
							position: 'absolute',
							bottom: 80,
							left: 40,
							right: 40,
							backgroundColor: 'rgba(15,23,42,0.92)',
							padding: '24px 32px',
							borderRadius: 20,
							border: '1px solid rgba(220,38,38,0.4)',
							transform: `translateY(${text1Y}px)`,
						}}
					>
						<p className="font-body-bold" style={{ color: '#FFFFFF', fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
							El uso de cuerdas o cadenas arriesga multas graves e inmovilización del auto.
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: DECRETO SUPREMO 55/2025 (85 - 180 frames / 2.8s - 6.0s) ================= */}
			<Sequence from={85} durationInFrames={95}>
				<AbsoluteFill style={{ opacity: opacityScene2, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 40,
							right: 40,
							transform: `translateY(${text2Y}px)`,
						}}
					>
						<div
							style={{
								backgroundColor: '#2563EB',
								color: '#FFFFFF',
								fontSize: 20,
								fontWeight: 800,
								letterSpacing: 3,
								padding: '8px 20px',
								borderRadius: 8,
								display: 'inline-block',
								marginBottom: 16,
								textTransform: 'uppercase',
							}}
						>
							GOBIERNO CHILE • MTT
						</div>

						<h2
							className="font-headline-giant"
							style={{
								color: '#FFFFFF',
								fontSize: 92,
								lineHeight: 0.9,
								margin: 0,
								textTransform: 'uppercase',
							}}
						>
							DECRETO SUPREMO <br />
							<span style={{ color: '#60A5FA' }}>N° 55 / 2025</span>
						</h2>
					</div>

					<div
						style={{
							position: 'absolute',
							bottom: 80,
							left: 40,
							right: 40,
							backgroundColor: 'rgba(15,23,42,0.92)',
							padding: '24px 32px',
							borderRadius: 20,
							border: '1px solid rgba(37,99,235,0.4)',
							transform: `translateY(${text2Y}px)`,
						}}
					>
						<p className="font-body-bold" style={{ color: '#FFFFFF', fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
							Exige uso exclusivo de <span style={{ color: '#60A5FA' }}>ACOPLE METÁLICO RÍGIDO</span>.
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: ESPECIFICACIONES CON LA FOTO REAL AUTÉNTICA DEL PRODUCTO EN USO (175 - 280 frames / 5.8s - 9.3s) ================= */}
			<Sequence from={175} durationInFrames={105}>
				<AbsoluteFill style={{ opacity: opacityScene3, overflow: 'hidden' }}>
					{/* FOTO REAL AUTÉNTICA DE LA LANZA EN USO EN CHILE */}
					<Img
						src={staticFile('images/lanza_real_uso_oficial.jpg')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							objectPosition: 'center 40%',
							filter: 'brightness(0.55) contrast(1.2)',
						}}
					/>
					<AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(10,13,20,0.92) 0%, rgba(10,13,20,0.15) 45%, rgba(10,13,20,0.95) 100%)' }} />

					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 40,
							right: 40,
							transform: `translateY(${text3Y}px)`,
						}}
					>
						<span className="font-body-bold" style={{ color: '#F59E0B', fontSize: 20, fontWeight: 800, letterSpacing: 3, uppercase: true }}>
							ACERO MACIZO CHILENO
						</span>

						<h2 className="font-headline-giant" style={{ color: '#FFFFFF', fontSize: 88, lineHeight: 0.9, margin: '8px 0 0 0' }}>
							PRODUCTO 100% REAL
						</h2>
					</div>

					{/* LAS 3 TARJETAS ENTRAN UNA POR UNA CON NUMERACIÓN TÉCNICA LIMPIA SIN EMOJIS */}
					<div
						style={{
							position: 'absolute',
							bottom: 80,
							left: 40,
							right: 40,
							display: 'flex',
							flexDirection: 'column',
							gap: 16,
						}}
					>
						{/* TARJETA 1 */}
						<div
							style={{
								backgroundColor: 'rgba(15,23,42,0.92)',
								backdropFilter: 'blur(10px)',
								padding: '20px 24px',
								borderRadius: 18,
								borderLeft: '6px solid #F59E0B',
								borderTop: '1px solid rgba(255,255,255,0.15)',
								borderRight: '1px solid rgba(255,255,255,0.15)',
								borderBottom: '1px solid rgba(255,255,255,0.15)',
								opacity: card1Opacity,
								transform: `translateY(${card1Y}px)`,
							}}
						>
							<div className="font-body-bold" style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 800 }}>
								01 • Ojales Forjados en Fragua Candente
							</div>
						</div>

						{/* TARJETA 2 */}
						<div
							style={{
								backgroundColor: 'rgba(15,23,42,0.92)',
								backdropFilter: 'blur(10px)',
								padding: '20px 24px',
								borderRadius: 18,
								borderLeft: '6px solid #DC2626',
								borderTop: '1px solid rgba(255,255,255,0.15)',
								borderRight: '1px solid rgba(255,255,255,0.15)',
								borderBottom: '1px solid rgba(255,255,255,0.15)',
								opacity: card2Opacity,
								transform: `translateY(${card2Y}px)`,
							}}
						>
							<div className="font-body-bold" style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 800 }}>
								02 • Soldadura Estructural TIG / MIG
							</div>
						</div>

						{/* TARJETA 3 */}
						<div
							style={{
								backgroundColor: 'rgba(15,23,42,0.92)',
								backdropFilter: 'blur(10px)',
								padding: '20px 24px',
								borderRadius: 18,
								borderLeft: '6px solid #2563EB',
								borderTop: '1px solid rgba(255,255,255,0.15)',
								borderRight: '1px solid rgba(255,255,255,0.15)',
								borderBottom: '1px solid rgba(255,255,255,0.15)',
								opacity: card3Opacity,
								transform: `translateY(${card3Y}px)`,
							}}
						>
							<div className="font-body-bold" style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 800 }}>
								03 • Arrastre Directo: 2.500 kg a 3.500 kg
							</div>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: PRECIO Y BOTÓN WHATSAPP INMEDIATO (275 - 450 frames / 9.1s - 15.0s) ================= */}
			<Sequence from={275} durationInFrames={175}>
				<AbsoluteFill style={{ opacity: opacityScene4, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 150,
							left: 40,
							right: 40,
							transform: `translateY(${text4Y}px)`,
						}}
					>
						<span className="font-body-bold" style={{ color: '#F59E0B', fontSize: 22, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>
							OFERTA DIRECTA DEL FABRICANTE
						</span>

						<div
							className="font-headline-giant"
							style={{
								color: '#FFFFFF',
								fontSize: 120,
								lineHeight: 0.85,
								margin: '12px 0 0 0',
							}}
						>
							$65.000 <span className="font-body-bold" style={{ fontSize: 32, color: '#F59E0B', fontWeight: 800 }}>CLP</span>
						</div>

						<p className="font-body-bold" style={{ color: '#60A5FA', fontSize: 26, fontWeight: 800, marginTop: 16 }}>
							Despacho Rápido a Todo Chile • Garantía de Fábrica
						</p>
					</div>

					{/* BOTÓN CTA ENTRA DE INMEDIATO EN EL SEGUNDO 9.5 SIN DEMORAS PEGADAS */}
					<div
						style={{
							position: 'absolute',
							bottom: 80,
							left: 40,
							right: 40,
							transform: `scale(${ctaSpring})`,
						}}
					>
						<div
							style={{
								backgroundColor: '#25D366',
								color: '#FFFFFF',
								fontSize: 32,
								fontWeight: 900,
								padding: '24px 36px',
								borderRadius: 20,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 16,
								width: '100%',
								letterSpacing: 1,
								textTransform: 'uppercase',
								boxShadow: '0 15px 40px rgba(37,211,102,0.5)',
							}}
						>
							<span>PEDIR POR WHATSAPP</span>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* BARRA DE PROGRESO */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: `${progressWidth}%`,
					height: 8,
					backgroundColor: '#DC2626',
				}}
			/>
		</AbsoluteFill>
	);
};
