import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const LanzaEditorialClean: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso discreta
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Transiciones de escena con desaceleracion exponencial pura (sin rebotes ni resortes)
	// ESCENA 1: 0 - 110 frames (0 - 3.6s)
	const opacityScene1 = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const text1Y = interpolate(frame, [0, 25], [30, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateRight: 'clamp',
	});

	// ESCENA 2: 105 - 220 frames (3.5 - 7.3s)
	const opacityScene2 = interpolate(frame, [105, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text2Y = interpolate(frame, [105, 130], [30, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// ESCENA 3: 215 - 330 frames (7.1 - 11.0s)
	const opacityScene3 = interpolate(frame, [215, 230], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text3Y = interpolate(frame, [215, 240], [30, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// ESCENA 4: 325 - 450 frames (10.8 - 15.0s)
	const opacityScene4 = interpolate(frame, [325, 340], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const text4Y = interpolate(frame, [325, 350], [30, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#0B0E14', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
			{/* IMPORTACIÓN DE TIPOGRAFÍAS EDITORIALES GOOGLE FONTS */}
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap');

					.font-headline {
						font-family: 'Bebas Neue', sans-serif;
						letter-spacing: 2px;
					}
					.font-body {
						font-family: 'Space Grotesk', sans-serif;
					}
				`}
			</style>

			{/* MÚSICA DE FONDO */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.5} />

			{/* CAPA 0: B-ROLL DE VIDEO HD CON VIÑETEADO EDITORIAL DESPEJADO */}
			<AbsoluteFill style={{ overflow: 'hidden' }}>
				<OffthreadVideo
					src={staticFile('videos/pickup_tow.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'brightness(0.55) contrast(1.1)',
					}}
				/>
				{/* Sombra editorial sutil superior e inferior para despejar el video en el centro */}
				<AbsoluteFill
					style={{
						background: 'linear-gradient(to bottom, rgba(11,14,20,0.85) 0%, rgba(11,14,20,0.1) 40%, rgba(11,14,20,0.1) 65%, rgba(11,14,20,0.9) 100%)',
					}}
				/>
			</AbsoluteFill>

			{/* HEADER DISCRETO CON LOGO / MARCA */}
			<div
				style={{
					position: 'absolute',
					top: 60,
					left: 60,
					right: 60,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					zIndex: 50,
					borderBottom: '1px solid rgba(255,255,255,0.15)',
					paddingBottom: 20,
				}}
			>
				<span className="font-headline" style={{ color: '#FFFFFF', fontSize: 28, letterSpacing: 3 }}>
					METAL CREATIVO
				</span>
				<span className="font-body" style={{ color: '#E05638', fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
					CHILE • 2026
				</span>
			</div>

			{/* ================= ESCENA 1: EL HOOK LEGAL EDITORIAL (0 - 110) ================= */}
			<Sequence from={0} durationInFrames={110}>
				<AbsoluteFill style={{ opacity: opacityScene1, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 140,
							left: 60,
							right: 60,
							transform: `translateY(${text1Y}px)`,
						}}
					>
						<span
							className="font-body"
							style={{
								color: '#E05638',
								fontSize: 14,
								fontWeight: 700,
								letterSpacing: 3,
								textTransform: 'uppercase',
								display: 'block',
								marginBottom: 12,
							}}
						>
							REGULACIÓN DE TRÁNSITO EN CHILE
						</span>

						<h1
							className="font-headline"
							style={{
								color: '#FFFFFF',
								fontSize: 72,
								lineHeight: 0.95,
								margin: 0,
								textTransform: 'uppercase',
							}}
						>
							PROHIBIDO REMOLCAR <br />
							<span style={{ color: '#F5E6D3' }}>CON PIOLA O CUERDA</span>
						</h1>
					</div>

					<div
						style={{
							position: 'absolute',
							bottom: 100,
							left: 60,
							right: 60,
							transform: `translateY(${text1Y}px)`,
						}}
					>
						<p className="font-body" style={{ color: '#CBD5E1', fontSize: 20, margin: 0, maxWidth: 650, lineHeight: 1.4 }}>
							El uso de tirantes de género o cadenas arriesga sanciones graves e inmovilización del vehículo.
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: DECRETO SUPREMO N° 55/2025 (105 - 220) ================= */}
			<Sequence from={105} durationInFrames={115}>
				<AbsoluteFill style={{ opacity: opacityScene2, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 140,
							left: 60,
							right: 60,
							transform: `translateY(${text2Y}px)`,
						}}
					>
						<span
							className="font-body"
							style={{
								color: '#94A3B8',
								fontSize: 14,
								fontWeight: 700,
								letterSpacing: 3,
								textTransform: 'uppercase',
								display: 'block',
								marginBottom: 12,
							}}
						>
							NORMATIVA MINISTERIAL MTT
						</span>

						<h2
							className="font-headline"
							style={{
								color: '#FFFFFF',
								fontSize: 72,
								lineHeight: 0.95,
								margin: 0,
								textTransform: 'uppercase',
							}}
						>
							DECRETO SUPREMO <br />
							<span style={{ color: '#E05638' }}>N° 55 / 2025</span>
						</h2>
					</div>

					<div
						style={{
							position: 'absolute',
							bottom: 100,
							left: 60,
							right: 60,
							transform: `translateY(${text2Y}px)`,
						}}
					>
						<p className="font-body" style={{ color: '#F5E6D3', fontSize: 22, fontWeight: 500, margin: 0, maxWidth: 700, lineHeight: 1.4 }}>
							Exige de forma obligatoria el uso de acople metálico rígido entre vehículos particulares.
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: ESPECIFICACIONES TÉCNICAS (215 - 330) ================= */}
			<Sequence from={215} durationInFrames={115}>
				<AbsoluteFill style={{ opacity: opacityScene3, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 140,
							left: 60,
							right: 60,
							transform: `translateY(${text3Y}px)`,
						}}
					>
						<span
							className="font-body"
							style={{
								color: '#E05638',
								fontSize: 14,
								fontWeight: 700,
								letterSpacing: 3,
								textTransform: 'uppercase',
								display: 'block',
								marginBottom: 12,
							}}
						>
							ESPECIFICACIONES DE MAESTRANZA
						</span>

						<h2
							className="font-headline"
							style={{
								color: '#FFFFFF',
								fontSize: 68,
								lineHeight: 0.95,
								margin: 0,
								textTransform: 'uppercase',
							}}
						>
							BARRA RÍGIDA DE REMOLQUE
						</h2>
					</div>

					{/* LISTA LIMPIA TIPO CATÁLOGO EDITORIAL */}
					<div
						style={{
							position: 'absolute',
							bottom: 100,
							left: 60,
							right: 60,
							display: 'flex',
							flexDirection: 'column',
							gap: 16,
							transform: `translateY(${text3Y}px)`,
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
							<span className="font-headline" style={{ color: '#E05638', fontSize: 24 }}>01</span>
							<span className="font-body" style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 500 }}>Estructura de Acero al Carbono Macizo</span>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
							<span className="font-headline" style={{ color: '#E05638', fontSize: 24 }}>02</span>
							<span className="font-body" style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 500 }}>Ojales Forjados en Fragua con Pasadores</span>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 12 }}>
							<span className="font-headline" style={{ color: '#E05638', fontSize: 24 }}>03</span>
							<span className="font-body" style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 500 }}>Capacidad de Arrastre: 2.500 kg a 3.500 kg</span>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: PRECIO Y COTIZACIÓN EDITORIAL (325 - 450) ================= */}
			<Sequence from={325} durationInFrames={125}>
				<AbsoluteFill style={{ opacity: opacityScene4, overflow: 'hidden' }}>
					<div
						style={{
							position: 'absolute',
							top: 140,
							left: 60,
							right: 60,
							transform: `translateY(${text4Y}px)`,
						}}
					>
						<span
							className="font-body"
							style={{
								color: '#94A3B8',
								fontSize: 14,
								fontWeight: 700,
								letterSpacing: 3,
								textTransform: 'uppercase',
								display: 'block',
								marginBottom: 8,
							}}
						>
							FABRICACIÓN Y DESPACHO EN CHILE
						</span>

						<div
							className="font-headline"
							style={{
								color: '#FFFFFF',
								fontSize: 96,
								lineHeight: 0.9,
								margin: 0,
							}}
						>
							$89.900 <span className="font-body" style={{ fontSize: 24, color: '#E05638', fontWeight: 700 }}>CLP</span>
						</div>
					</div>

					{/* BOTÓN / CTA EDITORIAL MÍNIMO Y ELEGANTE */}
					<div
						style={{
							position: 'absolute',
							bottom: 100,
							left: 60,
							right: 60,
							transform: `translateY(${text4Y}px)`,
						}}
					>
						<div
							style={{
								backgroundColor: '#FFFFFF',
								color: '#0B0E14',
								fontSize: 18,
								fontWeight: 700,
								padding: '20px 32px',
								borderRadius: 12,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'between',
								width: '100%',
								letterSpacing: 1,
								textTransform: 'uppercase',
								boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
							}}
						>
							<span className="font-body" style={{ flexGrow: 1, textAlign: 'left' }}>COTIZAR EN WHATSAPP</span>
							<span className="font-headline" style={{ fontSize: 24, color: '#E05638' }}>→</span>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* BARRA DE PROGRESO EDITORIAL DISCRETA */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: `${progressWidth}%`,
					height: 4,
					backgroundColor: '#E05638',
				}}
			/>
		</AbsoluteFill>
	);
};
