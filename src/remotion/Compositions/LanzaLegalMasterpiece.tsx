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
	Img,
} from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';

import shieldAnimationData from '../../../public/lottie/shield_check.json';

// COMPONENTE PRO: KINETIC WORD REVEAL (Palabra por palabra con desfasaje y física)
const KineticWords: React.FC<{
	text: string;
	startFrame: number;
	fontSize?: number;
	color?: string;
	highlightColor?: string;
	highlightWords?: string[];
}> = ({ text, startFrame, fontSize = 54, color = '#FFFFFF', highlightColor = '#FF2A2A', highlightWords = [] }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const words = text.split(' ');

	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap: '12px 18px',
				maxWidth: 900,
			}}
		>
			{words.map((word, index) => {
				const wordDelay = startFrame + index * 4; // 4 frames de desfasaje por palabra
				const isHighlighted = highlightWords.includes(word.toUpperCase().replace(/[^A-Z0-9]/g, ''));

				const wordOpacity = interpolate(frame - wordDelay, [0, 6], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});

				const wordScale = spring({
					frame: frame - wordDelay,
					fps,
					config: { damping: 14, stiffness: 220, mass: 0.4 },
				});

				const wordY = interpolate(frame - wordDelay, [0, 8], [30, 0], {
					easing: Easing.bezier(0.16, 1, 0.3, 1),
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});

				return (
					<span
						key={index}
						style={{
							fontSize,
							fontWeight: 900,
							color: isHighlighted ? highlightColor : color,
							opacity: wordOpacity,
							transform: `translateY(${wordY}px) scale(${wordScale})`,
							display: 'inline-block',
							textTransform: 'uppercase',
							letterSpacing: -1,
							filter: isHighlighted ? `drop-shadow(0 0 20px ${highlightColor})` : 'none',
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};

export const LanzaLegalMasterpiece: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Progress bar
	const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// ESCENA 1: HOOK LEGAL ULTRA-RÁPIDO (0 - 65 frames / 0 - 2.1s)
	const scaleBg1 = interpolate(frame, [0, 65], [1.0, 1.15], {
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});

	// ESCENA 2: VIRTUAL INSPECTION / DECRETO 55 (60 - 135 frames / 2.0 - 4.5s)
	const opacityScene2 = interpolate(frame, [60, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const scaleProduct2 = spring({
		frame: frame - 65,
		fps,
		config: { damping: 16, stiffness: 190 },
	});

	// ESCENA 3: PRODUCTO HÉROE DE CERCA (130 - 220 frames / 4.3 - 7.3s)
	const opacityScene3 = interpolate(frame, [130, 142], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const hero3Scale = spring({
		frame: frame - 135,
		fps,
		config: { damping: 14, stiffness: 200 },
	});

	// ESCENA 4: LOTTIE SHIELD + TECH SPECS (215 - 310 frames / 7.1 - 10.3s)
	const opacityScene4 = interpolate(frame, [215, 227], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const lottieScale = spring({
		frame: frame - 220,
		fps,
		config: { damping: 16, stiffness: 180 },
	});

	// ESCENA 5: PRECIO IMPACTO + CTA WHATSAPP (305 - 450 frames / 10.1 - 15.0s)
	const opacityScene5 = interpolate(frame, [305, 317], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const ctaSpring = spring({
		frame: frame - 325,
		fps,
		config: { damping: 18, stiffness: 200 },
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#050608', fontFamily: "'Inter', system-ui, sans-serif" }}>
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.65} />

			{/* FONDO VIDEO HD B-ROLL EN MOVIMIENTO PERMANENTE */}
			<AbsoluteFill style={{ overflow: 'hidden' }}>
				<OffthreadVideo
					src={staticFile('videos/pickup_tow.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'brightness(0.3) contrast(1.3) saturate(1.1)',
					}}
				/>
				<AbsoluteFill
					style={{
						background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(5,6,8,0.94) 82%)',
					}}
				/>
			</AbsoluteFill>

			{/* ================= ESCENA 1: HOOK KINETIC IMPACTO (0 - 65 frames / 0 - 2.1s) ================= */}
			<Sequence from={0} durationInFrames={65}>
				<AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
					<div
						style={{
							backgroundColor: '#FF2A2A',
							color: '#FFFFFF',
							fontSize: 18,
							fontWeight: 900,
							letterSpacing: 4,
							padding: '8px 24px',
							borderRadius: 100,
							marginBottom: 32,
							boxShadow: '0 0 30px rgba(255, 42, 42, 0.7)',
						}}
					>
						⚠️ INFRACCIÓN GRAVE DE TRÁNSITO
					</div>

					<KineticWords
						text="PROHIBIDO REMOLCAR CON PIOLA EN CHILE"
						startFrame={5}
						fontSize={60}
						highlightWords={['PROHIBIDO', 'PIOLA']}
						highlightColor="#FF2A2A"
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 2: ALERTA LEY DECRETO 55/2025 (60 - 135 frames / 2.0 - 4.5s) ================= */}
			<Sequence from={60} durationInFrames={75}>
				<AbsoluteFill style={{ opacity: opacityScene2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
					<Img
						src={staticFile('images/carabineros_inspection.jpg')}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'brightness(0.25) contrast(1.2)',
						}}
					/>
					<AbsoluteFill style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(5,6,8,0.95) 85%)' }} />

					<div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
						<span style={{ color: '#00F0FF', fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20 }}>
							MINISTERIO DE TRANSPORTES CHILE
						</span>

						<KineticWords
							text="DECRETO 55/2025 EXIGE ACOPLE METÁLICO RÍGIDO"
							startFrame={65}
							fontSize={52}
							highlightWords={['DECRETO', 'METÁLICO', 'RÍGIDO']}
							highlightColor="#00F0FF"
						/>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 3: PRODUCTO HÉROES EN PRIMER PLANO (130 - 220 frames / 4.3 - 7.3s) ================= */}
			<Sequence from={130} durationInFrames={90}>
				<AbsoluteFill style={{ opacity: opacityScene3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
					<span style={{ color: '#FF6A00', fontSize: 16, fontWeight: 900, letterSpacing: 4, uppercase: true, marginBottom: 20 }}>
						CALIDAD METAL CREATIVO
					</span>

					{/* FOTO DEL PRODUCTO HÉROE AISLADO CON SOMBRA Y FLOTANDO */}
					<div
						style={{
							position: 'relative',
							width: 900,
							height: 480,
							borderRadius: 24,
							overflow: 'hidden',
							border: '2px solid rgba(255, 106, 0, 0.4)',
							boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(255,106,0,0.3)',
							transform: `scale(${hero3Scale})`,
							marginBottom: 28,
						}}
					>
						<Img src={staticFile('images/lanza_pasador.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						<div style={{ position: 'absolute', bottom: 16, left: 24, backgroundColor: 'rgba(0,0,0,0.85)', padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 18, fontWeight: 800 }}>
							⚙️ OJALES FORJADOS & PASADORES PASANTES
						</div>
					</div>

					<KineticWords
						text="ACERO MACIZO AL CARBONO 3.500 KG ARRASTRE"
						startFrame={135}
						fontSize={42}
						highlightWords={['MACIZO', '3.500', 'KG']}
						highlightColor="#FF6A00"
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 4: LOTTIE VECTORIAL ESCUDO (215 - 310 frames / 7.1 - 10.3s) ================= */}
			<Sequence from={215} durationInFrames={95}>
				<AbsoluteFill style={{ opacity: opacityScene4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
					<div style={{ width: 240, height: 240, transform: `scale(${lottieScale})`, filter: 'drop-shadow(0 0 35px rgba(0,240,255,0.5))', marginBottom: 20 }}>
						<Lottie animationData={shieldAnimationData as LottieAnimationData} loop playbackRate={1} />
					</div>

					<KineticWords
						text="SEGURIDAD Y CERO CHOQUES POR ALCANCE"
						startFrame={220}
						fontSize={48}
						highlightWords={['SEGURIDAD', 'CERO', 'CHOQUES']}
						highlightColor="#00F0FF"
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ================= ESCENA 5: PRECIO IMPACTO & CTA WHATSAPP (305 - 450 frames / 10.1 - 15s) ================= */}
			<Sequence from={305} durationInFrames={145}>
				<AbsoluteFill style={{ opacity: opacityScene5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', textAlign: 'center' }}>
					<span style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>
						OFERTA DIRECTA DEL FABRICANTE
					</span>

					<div style={{ fontSize: 96, fontWeight: 900, color: '#FFFFFF', letterSpacing: -4, lineHeight: 1 }}>
						$89.900 <span style={{ fontSize: 32, color: '#FF6A00', fontWeight: 800 }}>CLP</span>
					</div>

					<p style={{ color: '#00F0FF', fontSize: 24, fontWeight: 700, marginTop: 16 }}>
						🚚 Envío Rápido a Todo Chile | Garantía Total
					</p>

					<div style={{ marginTop: 40, width: '100%', transform: `scale(${ctaSpring})` }}>
						<div
							style={{
								backgroundColor: '#25D366',
								color: '#FFFFFF',
								fontSize: 28,
								fontWeight: 900,
								padding: '22px 44px',
								borderRadius: 100,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 14,
								boxShadow: '0 12px 45px rgba(37,211,102,0.6)',
								width: '100%',
								textTransform: 'uppercase',
								letterSpacing: 2,
							}}
						>
							<span>PEDIR EN WHATSAPP NOW</span>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* BARRA DE PROGRESO INFERIOR */}
			<div style={{ position: 'absolute', bottom: 0, left: 0, width: `${progressWidth}%`, height: 8, backgroundColor: '#FF6A00', boxShadow: '0 0 15px #FF6A00' }} />
		</AbsoluteFill>
	);
};
