import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
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

	// Barra de progreso del video
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// --- ESCENA 1: EL HOOK LEGAL (0 a 110 frames / 0 - 3.6s) ---
	const scaleBg1 = interpolate(frame, [0, 110], [1.0, 1.12], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateRight: 'clamp',
	});
	
	// Animaciones Kinetic desfasadas para el texto de la Escena 1
	const title1Y = interpolate(frame, [5, 25], [60, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const title1Opacity = interpolate(frame, [5, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const sub1Y = interpolate(frame, [18, 38], [40, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const sub1Opacity = interpolate(frame, [18, 33], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- ESCENA 2: DECRETO SUPREMO 55/2025 (100 a 240 frames / 3.3 - 8s) ---
	const opacityScene2 = interpolate(frame, [100, 115], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scaleBg2 = interpolate(frame, [100, 240], [1.1, 1.0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const title2Y = interpolate(frame, [110, 130], [50, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- ESCENA 3: ACERO MACIZO ESTRUCTURAL (230 a 350 frames / 7.6 - 11.6s) ---
	const opacityScene3 = interpolate(frame, [230, 245], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scaleBg3 = interpolate(frame, [230, 350], [1.0, 1.15], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- ESCENA 4: PRECIO Y CTA WHATSAPP (340 a 450 frames / 11.3 - 15s) ---
	const opacityScene4 = interpolate(frame, [340, 355], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const springCta = spring({
		frame: frame - 355,
		fps,
		config: { damping: 18, stiffness: 200, mass: 0.4 },
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#050608', fontFamily: "'Inter', system-ui, sans-serif" }}>
			{/* MÚSICA DE FONDO */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.7} />

			{/* ================= ESCENA 1: HOOK LEGAL (0 - 110) ================= */}
			<Sequence from={0} durationInFrames={110}>
				<AbsoluteFill style={{ overflow: 'hidden' }}>
					<Img
						src={staticFile('images/rope_hook.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleBg1})`,
							filter: 'brightness(0.35) contrast(1.2)',
						}}
					/>
					{/* Gradiente cinemático oscuro */}
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(5,6,8,0.92) 85%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 240,
							left: 48,
							right: 48,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
						}}
					>
						{/* BADGE DE ALERTA ALTA VISIBILIDAD */}
						<div
							style={{
								backgroundColor: '#FF2A2A',
								color: '#FFFFFF',
								fontSize: 18,
								fontWeight: 900,
								letterSpacing: 4,
								padding: '8px 24px',
								borderRadius: 100,
								textTransform: 'uppercase',
								marginBottom: 28,
								opacity: title1Opacity,
								transform: `translateY(${title1Y}px)`,
								boxShadow: '0 0 30px rgba(255, 42, 42, 0.6)',
							}}
						>
							INFRACCIÓN GRAVE DE TRÁNSITO
						</div>

						{/* TÍTULO PRINCIPAL KINETIC */}
						<h1
							style={{
								color: '#FFFFFF',
								fontSize: 64,
								fontWeight: 900,
								lineHeight: 1.05,
								letterSpacing: -2,
								margin: 0,
								opacity: title1Opacity,
								transform: `translateY(${title1Y}px)`,
								textTransform: 'uppercase',
							}}
						>
							PROHIBIDO <br />
							<span style={{ color: '#FF2A2A' }}>REMOLCAR CON PIOLA</span>
						</h1>

						{/* SUBTÍTULO LIMPIO Y LEGIBLE */}
						<p
							style={{
								color: '#D1D5DB',
								fontSize: 26,
								fontWeight: 500,
								marginTop: 32,
								lineHeight: 1.4,
								maxWidth: 800,
								opacity: sub1Opacity,
								transform: `translateY(${sub1Y}px)`,
							}}
						>
							El uso de cuerdas o piolas arriesga multas graves e inmovilización del vehículo en Chile.
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: DECRETO SUPREMO N° 55/2025 (100 - 240) ================= */}
			<Sequence from={100} durationInFrames={140}>
				<AbsoluteFill style={{ opacity: opacityScene2, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_carretera.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleBg2})`,
							filter: 'brightness(0.3) contrast(1.2)',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(5,6,8,0.95) 85%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 220,
							left: 48,
							right: 48,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
							transform: `translateY(${title2Y}px)`,
						}}
					>
						<span
							style={{
								color: '#38BDF8',
								fontSize: 16,
								fontWeight: 800,
								letterSpacing: 4,
								textTransform: 'uppercase',
								marginBottom: 16,
							}}
						>
							DECRETO SUPREMO N° 55/2025 MTT
						</span>

						<h2
							style={{
								color: '#FFFFFF',
								fontSize: 56,
								fontWeight: 900,
								lineHeight: 1.1,
								letterSpacing: -1,
								margin: 0,
								textTransform: 'uppercase',
							}}
						>
							EXIGE ACOPLE METÁLICO RÍGIDO
						</h2>

						<div
							style={{
								marginTop: 36,
								padding: '24px 32px',
								backgroundColor: 'rgba(255,255,255,0.05)',
								border: '1px solid rgba(255,255,255,0.15)',
								borderRadius: 20,
								backdropFilter: 'blur(10px)',
							}}
						>
							<p style={{ color: '#F3F4F6', fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
								🛡️ Solución metálica continua <strong style={{ color: '#38BDF8' }}>sin riesgo de choque por alcance</strong>.
							</p>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: FICHA TÉCNICA E INGENIERÍA (230 - 350) ================= */}
			<Sequence from={230} durationInFrames={120}>
				<AbsoluteFill style={{ opacity: opacityScene3, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_pasador.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scaleBg3})`,
							filter: 'brightness(0.3) contrast(1.2)',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(5,6,8,0.95) 85%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 200,
							left: 48,
							right: 48,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<span
							style={{
								color: '#FF6A00',
								fontSize: 16,
								fontWeight: 800,
								letterSpacing: 4,
								textTransform: 'uppercase',
								marginBottom: 16,
							}}
						>
							METAL CREATIVO CHILE
						</span>

						<h2 style={{ color: '#FFFFFF', fontSize: 52, fontWeight: 900, margin: 0, letterSpacing: -1, textAlign: 'center' }}>
							ACERO MACIZO ESTRUCTURAL
						</h2>

						<div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 16,
									backgroundColor: 'rgba(17,24,39,0.85)',
									padding: '20px 24px',
									borderRadius: 16,
									border: '1px solid rgba(255,255,255,0.1)',
								}}
							>
								<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF6A00' }} />
								<span style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 800 }}>Ojales Forjados en Fragua Candente</span>
							</div>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 16,
									backgroundColor: 'rgba(17,24,39,0.85)',
									padding: '20px 24px',
									borderRadius: 16,
									border: '1px solid rgba(255,255,255,0.1)',
								}}
							>
								<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF6A00' }} />
								<span style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 800 }}>Soldadura Estructural TIG / MIG</span>
							</div>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 16,
									backgroundColor: 'rgba(17,24,39,0.85)',
									padding: '20px 24px',
									borderRadius: 16,
									border: '1px solid rgba(255,255,255,0.1)',
								}}
							>
								<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#38BDF8' }} />
								<span style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 800 }}>Arrastre Directo: 2.500 kg a 3.500 kg</span>
							</div>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: PRECIO Y CTA WHATSAPP (340 - 450) ================= */}
			<Sequence from={340} durationInFrames={110}>
				<AbsoluteFill style={{ opacity: opacityScene4, overflow: 'hidden' }}>
					<Img
						src={staticFile('images/lanza_maletero.jpg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'brightness(0.25) contrast(1.2)',
						}}
					/>
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(5,6,8,0.95) 85%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							top: 220,
							left: 48,
							right: 48,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
						}}
					>
						<span style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase' }}>
							DESMONTABLE EN 3 PARTES PARA MALETERA
						</span>

						<div style={{ marginTop: 24, fontSize: 80, fontWeight: 900, color: '#FFFFFF', letterSpacing: -2 }}>
							$89.900 <span style={{ fontSize: 28, color: '#9CA3AF', fontWeight: 700 }}>CLP</span>
						</div>

						<p style={{ color: '#38BDF8', fontSize: 22, fontWeight: 700, marginTop: 12 }}>
							🚚 Despacho rápido a todo Chile por Starken / Chilexpress
						</p>
					</div>

					{/* BOTÓN CTA SLIM & MODERNO */}
					<div
						style={{
							position: 'absolute',
							bottom: 160,
							left: 48,
							right: 48,
							display: 'flex',
							justifyContent: 'center',
							transform: `scale(${springCta})`,
						}}
					>
						<div
							style={{
								backgroundColor: '#25D366',
								color: '#FFFFFF',
								fontSize: 26,
								fontWeight: 900,
								padding: '20px 40px',
								borderRadius: 100,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 12,
								boxShadow: '0 10px 40px rgba(37,211,102,0.5)',
								width: '100%',
								textTransform: 'uppercase',
								letterSpacing: 2,
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
					height: 6,
					backgroundColor: '#FF6A00',
					boxShadow: '0 0 10px #FF6A00',
				}}
			/>
		</AbsoluteFill>
	);
};
