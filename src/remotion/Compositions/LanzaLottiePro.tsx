import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	interpolate,
	OffthreadVideo,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';

// Importar datos de animación Lottie JSON
import shieldAnimationData from '../../../public/lottie/shield_check.json';

export const LanzaLottiePro: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso inferior
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Animaciones kinetic de entrada
	const badgeY = interpolate(frame, [5, 25], [50, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const badgeOpacity = interpolate(frame, [5, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const titleY = interpolate(frame, [15, 35], [50, 0], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const titleOpacity = interpolate(frame, [15, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const lottieScale = spring({
		frame: frame - 25,
		fps,
		config: { damping: 16, stiffness: 180, mass: 0.5 },
	});

	const ctaSpring = spring({
		frame: frame - 355,
		fps,
		config: { damping: 18, stiffness: 200, mass: 0.4 },
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#050608', fontFamily: "'Inter', system-ui, sans-serif" }}>
			{/* MÚSICA DE FONDO CINEMÁTICA */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.6} />

			{/* CAPA 0: B-ROLL DE VIDEO REAL HD EN MOVIMIENTO */}
			<AbsoluteFill style={{ overflow: 'hidden' }}>
				<OffthreadVideo
					src={staticFile('videos/pickup_tow.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'brightness(0.35) contrast(1.25) saturate(1.1)',
					}}
				/>
				{/* DEGRADADO VIÑETEADO PROFUNDO AFECTANDO AL B-ROLL */}
				<AbsoluteFill
					style={{
						background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(5,6,8,0.92) 80%)',
					}}
				/>
			</AbsoluteFill>

			{/* ================= ESCENA 1: LOTTIE VECTORIAL + HOOK PUBLICITARIO ================= */}
			<Sequence from={0} durationInFrames={220}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '0 48px',
						textAlign: 'center',
					}}
				>
					{/* CAPA 1: ANIMACIÓN LOTTIE VECTORIAL PRO (AFTER EFFECTS JSON) */}
					<div
						style={{
							width: 260,
							height: 260,
							marginBottom: 30,
							transform: `scale(${lottieScale})`,
							filter: 'drop-shadow(0 0 40px rgba(0,240,255,0.4))',
						}}
					>
						<Lottie
							animationData={shieldAnimationData as LottieAnimationData}
							loop
							playbackRate={1}
						/>
					</div>

					{/* BADGE ELEGANTE */}
					<div
						style={{
							backgroundColor: '#FF2A2A',
							color: '#FFFFFF',
							fontSize: 16,
							fontWeight: 900,
							letterSpacing: 4,
							padding: '8px 24px',
							borderRadius: 100,
							textTransform: 'uppercase',
							marginBottom: 20,
							opacity: badgeOpacity,
							transform: `translateY(${badgeY}px)`,
							boxShadow: '0 0 30px rgba(255,42,42,0.5)',
						}}
					>
						EXIGENCIA LEGAL DECRETO N° 55/2025
					</div>

					{/* TÍTULO KINETIC SUIZO */}
					<h1
						style={{
							color: '#FFFFFF',
							fontSize: 58,
							fontWeight: 900,
							lineHeight: 1.1,
							letterSpacing: -2,
							margin: 0,
							textTransform: 'uppercase',
							opacity: titleOpacity,
							transform: `translateY(${titleY}px)`,
						}}
					>
						BARRA RÍGIDA DE REMOLQUE <br />
						<span style={{ color: '#00F0FF' }}>ACERO MACIZO CHILE</span>
					</h1>

					<p
						style={{
							color: '#E2E8F0',
							fontSize: 24,
							fontWeight: 500,
							marginTop: 24,
							lineHeight: 1.4,
							maxWidth: 760,
							opacity: titleOpacity,
						}}
					>
						Cumple la norma del Ministerio de Transportes. Arrastre directo de 2.500 kg a 3.500 kg.
					</p>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: PRECIO Y CTA WHATSAPP ================= */}
			<Sequence from={210} durationInFrames={240}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '0 48px',
						textAlign: 'center',
					}}
				>
					<span style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase' }}>
						OFERTA DIRECTA DEL FABRICANTE
					</span>

					<div style={{ marginTop: 24, fontSize: 84, fontWeight: 900, color: '#FFFFFF', letterSpacing: -3 }}>
						$89.900 <span style={{ fontSize: 28, color: '#9CA3AF', fontWeight: 700 }}>CLP</span>
					</div>

					<p style={{ color: '#00F0FF', fontSize: 22, fontWeight: 700, marginTop: 12 }}>
						🚚 Envío rápido a todo Chile | Garantía de por vida
					</p>

					{/* BOTÓN CTA SLIM & MODERNO */}
					<div
						style={{
							marginTop: 48,
							width: '100%',
							transform: `scale(${ctaSpring})`,
						}}
					>
						<div
							style={{
								backgroundColor: '#25D366',
								color: '#FFFFFF',
								fontSize: 26,
								fontWeight: 900,
								padding: '22px 40px',
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
