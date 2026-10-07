import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	OffthreadVideo,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// =============================================================================
// 1. SUBTÍTULO CINEMÁTICO VIRAL WORD-BY-WORD (SINCRONIZADO AL FRAME EXACTO)
// =============================================================================
// =============================================================================
// 1. SUBTÍTULO LITERAL VERBATIM SINCRONIZADO PALABRA POR PALABRA CON EL LOCUTOR
// =============================================================================
interface VerbatimWord {
	word: string;
	start: number;
	end: number;
	highlight?: boolean;
	color?: string;
}

interface VerbatimCaptionProps {
	words: VerbatimWord[];
	startFrame: number;
	durationFrames: number;
	topPercent?: number;
}

const VerbatimCaption: React.FC<VerbatimCaptionProps> = ({
	words,
	startFrame,
	durationFrames,
	topPercent = 28,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	if (frame < startFrame || frame >= startFrame + durationFrames) {
		return null;
	}

	const localFrame = frame - startFrame;

	// Rebote elástico de entrada
	const scale = spring({
		frame: localFrame,
		fps,
		config: {
			damping: 14,
			stiffness: 260,
			mass: 0.35,
		},
	});

	// Desvanecimiento al salir
	const opacity = interpolate(
		localFrame,
		[durationFrames - 4, durationFrames],
		[1, 0],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
	);

	return (
		<div
			style={{
				position: 'absolute',
				top: `${topPercent}%`,
				left: 40,
				right: 40,
				transform: `translateY(-50%) scale(${scale})`,
				opacity,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '16px 24px',
				zIndex: 85,
				pointerEvents: 'none',
			}}
		>
			{words.map((w, i) => {
				// ¿Esta palabra específica está siendo pronunciada por el locutor en este frame?
				const isCurrentlySpoken = frame >= w.start && frame <= w.end + 2;
				const hasBeenSpoken = frame > w.end + 2;

				let textColor = '#FFFFFF';
				if (isCurrentlySpoken) {
					textColor = w.color || '#FFE500';
				} else if (hasBeenSpoken && w.highlight) {
					textColor = w.color || '#FFE500';
				}

				const wordScale = isCurrentlySpoken ? 1.12 : 1.0;

				return (
					<span
						key={i}
						style={{
							fontFamily: '"Montserrat", "Arial Black", sans-serif',
							fontSize: 56,
							fontWeight: 900,
							letterSpacing: '0.02em',
							textTransform: 'uppercase',
							color: textColor,
							WebkitTextStroke: '4.5px #000000',
							paintOrder: 'stroke fill',
							textShadow: isCurrentlySpoken
								? `0 6px 0 #000000, 0 10px 30px rgba(0, 0, 0, 0.95), 0 0 35px ${textColor}CC`
								: '0 6px 0 #000000, 0 10px 25px rgba(0, 0, 0, 0.95)',
							transform: `scale(${wordScale})`,
							transition: 'transform 0.08s ease, color 0.08s ease',
							display: 'inline-block',
							margin: '0 10px',
						}}
					>
						{w.word}
					</span>
				);
			})}
		</div>
	);
};

// =============================================================================
// 2. CÁMARA CINEMÁTICA CON PUNCH-IN ZOOMS Y SHAKE (MICRO-VIBRACIÓN DE FUERZA)
// =============================================================================
interface CameraPunchProps {
	children: React.ReactNode;
	sceneDuration: number;
	punches?: Array<{ atFrame: number; targetScale: number; decayDuration?: number }>;
	shakeAt?: number[];
	transformOrigin?: string;
}

const CinematicCamera: React.FC<CameraPunchProps> = ({
	children,
	sceneDuration,
	punches = [],
	shakeAt = [],
	transformOrigin = 'center center',
}) => {
	const frame = useCurrentFrame();

	const baseDrift = interpolate(frame, [0, sceneDuration], [1.0, 1.04], {
		extrapolateRight: 'clamp',
	});

	let extraZoom = 0;
	for (const punch of punches) {
		if (frame >= punch.atFrame) {
			const dt = frame - punch.atFrame;
			const decayDur = punch.decayDuration || 35;
			if (dt < decayDur) {
				const punchCurve = Math.exp(-dt * 0.08);
				extraZoom = Math.max(extraZoom, (punch.targetScale - 1.0) * punchCurve);
			}
		}
	}

	let shakeX = 0;
	let shakeY = 0;
	for (const sf of shakeAt) {
		if (frame >= sf && frame < sf + 12) {
			const dt = frame - sf;
			const decay = Math.exp(-0.35 * dt);
			shakeX += Math.sin(dt * 2.5) * 12 * decay;
			shakeY += Math.cos(dt * 3.1) * 8 * decay;
		}
	}

	const finalScale = baseDrift + extraZoom;

	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				transformOrigin,
				transform: `scale(${finalScale}) translate(${shakeX}px, ${shakeY}px)`,
				transition: 'transform 0.05s ease-out',
			}}
		>
			{children}
		</div>
	);
};

// =============================================================================
// 3. FLASH TRANSITION CINEMATOGRÁFICO
// =============================================================================
const WhiteFlash: React.FC<{ atFrame: number; duration?: number }> = ({
	atFrame,
	duration = 5,
}) => {
	const frame = useCurrentFrame();
	if (frame < atFrame || frame >= atFrame + duration) return null;
	const local = frame - atFrame;
	const opacity = interpolate(local, [0, 1, duration], [0, 0.65, 0], {
		extrapolateRight: 'clamp',
	});
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				backgroundColor: '#FFFFFF',
				opacity,
				zIndex: 95,
				pointerEvents: 'none',
			}}
		/>
	);
};

// =============================================================================
// 4. COMPOSICIÓN MAESTRA REEL ALERTA LEGAL MTT ($65.000 CLP)
// =============================================================================
export const Reel01Cinematico: React.FC = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// Barra de progreso inferior
	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Opacidad del logo flotante (se oculta en la lámina final)
	const logoOpacity = interpolate(frame, [741, 751], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Color grading profesional
	const cinematicGrade = 'brightness(1.06) contrast(1.08) saturate(1.18)';

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#000000',
				fontFamily: '"Montserrat", sans-serif',
				color: '#FFFFFF',
				overflow: 'hidden',
			}}
		>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');
			`}</style>

			{/* ===================================================================== */}
			{/* AUDIO: MÚSICA DE FONDO SUAVE Y ELEGANTE (SIN RUIDOS MOLESTOS)         */}
			{/* ===================================================================== */}
			<Audio
				src={staticFile('audio/reel_opcion1/bg_music_30s.mp3')}
				volume={(f) => {
					if (f > 850) {
						return interpolate(f, [850, 932], [0.04, 0], {
							extrapolateRight: 'clamp',
						});
					}
					return 0.04;
				}}
			/>

			{/* ===================================================================== */}
			{/* ESCENA 1: HOOK LEGAL MTT (Frames 0 - 117 = 3.90s)                     */}
			{/* Spoken: "¿Sabías que remolcar con cuerda o piola es multa grave en Chile?" */}
			{/* ===================================================================== */}
			<Sequence from={0} durationInFrames={117}>
				<Audio src={staticFile('audio/reel_legal/scene1_hook.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={117}
					transformOrigin="65% 55%"
					punches={[{ atFrame: 69, targetScale: 1.15, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_legal/clip1_hook_legal.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos literales palabra por palabra */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={31}
					words={[
						{ word: '¿SABÍAS', start: 3, end: 14 },
						{ word: 'QUE', start: 15, end: 17 },
						{ word: 'REMOLCAR', start: 18, end: 30, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={31}
					durationFrames={25}
					words={[
						{ word: 'CON', start: 32, end: 37 },
						{ word: 'CUERDA', start: 37, end: 45, highlight: true, color: '#00E5FF' },
						{ word: 'O', start: 45, end: 47 },
						{ word: 'PIOLA', start: 48, end: 55, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={56}
					durationFrames={61}
					words={[
						{ word: 'ES', start: 56, end: 58 },
						{ word: 'MULTA', start: 59, end: 67, highlight: true, color: '#FF3B30' },
						{ word: 'GRAVE', start: 69, end: 76, highlight: true, color: '#FF3B30' },
						{ word: 'EN', start: 75, end: 78 },
						{ word: 'CHILE?', start: 79, end: 117, highlight: true, color: '#FFE500' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 2: NORMATIVA DECRETO 55 MTT (Frames 117 - 265 = 4.93s)         */}
			{/* Spoken: "El Ministerio de Transportes exige acople rígido para evitar choques por alcance." */}
			{/* ===================================================================== */}
			<Sequence from={117} durationInFrames={148}>
				<Audio src={staticFile('audio/reel_legal/scene2_ley.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={148}
					transformOrigin="50% 60%"
					punches={[{ atFrame: 50, targetScale: 1.15, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_legal/clip2_enganche_legal.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos literales palabra por palabra */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={44}
					words={[
						{ word: 'EL', start: 3, end: 7 },
						{ word: 'MINISTERIO', start: 7, end: 20, highlight: true, color: '#00E5FF' },
						{ word: 'DE', start: 21, end: 23 },
						{ word: 'TRANSPORTES', start: 25, end: 41, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={44}
					durationFrames={32}
					words={[
						{ word: 'EXIGE', start: 40, end: 49 },
						{ word: 'ACOPLE', start: 50, end: 60, highlight: true, color: '#00FF66' },
						{ word: 'RÍGIDO', start: 61, end: 72, highlight: true, color: '#00FF66' },
					]}
				/>
				<VerbatimCaption
					startFrame={76}
					durationFrames={22}
					words={[
						{ word: 'PARA', start: 74, end: 78 },
						{ word: 'EVITAR', start: 80, end: 88, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={89}
					durationFrames={59}
					words={[
						{ word: 'CHOQUES', start: 90, end: 99, highlight: true, color: '#FF3B30' },
						{ word: 'POR', start: 101, end: 104 },
						{ word: 'ALCANCE', start: 104, end: 148, highlight: true, color: '#FFE500' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 3: ACERO Y 3 TRAMOS (Frames 265 - 434 = 5.63s)                 */}
			{/* Spoken: "Fabricada en tubo de acero reforzado de tres milímetros y desarmable en tres partes compactas." */}
			{/* ===================================================================== */}
			<Sequence from={265} durationInFrames={169}>
				<Audio src={staticFile('audio/reel_legal/scene3_acero.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={169}
					transformOrigin="48% 62%"
					punches={[{ atFrame: 58, targetScale: 1.15, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_legal/clip3_tramos_legal.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos literales palabra por palabra */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={42}
					words={[
						{ word: 'FABRICADA', start: 3, end: 18 },
						{ word: 'EN', start: 18, end: 21 },
						{ word: 'TUBO', start: 22, end: 27 },
						{ word: 'DE', start: 28, end: 30 },
						{ word: 'ACERO', start: 30, end: 39, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={42}
					durationFrames={43}
					words={[
						{ word: 'REFORZADO', start: 40, end: 54, highlight: true, color: '#00E5FF' },
						{ word: 'DE', start: 55, end: 57 },
						{ word: 'TRES', start: 58, end: 66, highlight: true, color: '#FFE500' },
						{ word: 'MILÍMETROS', start: 67, end: 83, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={85}
					durationFrames={23}
					words={[
						{ word: 'Y', start: 83, end: 85 },
						{ word: 'DESARMABLE', start: 84, end: 99, highlight: true, color: '#00FF66' },
						{ word: 'EN', start: 100, end: 104 },
					]}
				/>
				<VerbatimCaption
					startFrame={104}
					durationFrames={65}
					words={[
						{ word: 'TRES', start: 104, end: 110, highlight: true, color: '#FFE500' },
						{ word: 'PARTES', start: 112, end: 120 },
						{ word: 'COMPACTAS', start: 121, end: 169, highlight: true, color: '#00FF66' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 4: RESISTENCIA Y MALETERO (Frames 434 - 589 = 5.17s)           */}
			{/* Spoken: "Súper liviana para manipular, pero soporta hasta tres mil quinientos kilos de arrastre." */}
			{/* ===================================================================== */}
			<Sequence from={434} durationInFrames={155}>
				<Audio src={staticFile('audio/reel_legal/scene4_resistencia.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={155}
					transformOrigin="50% 45%"
					punches={[{ atFrame: 76, targetScale: 1.15, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_legal/clip4_levante_legal.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos literales palabra por palabra */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={50}
					words={[
						{ word: 'SÚPER', start: 3, end: 13, highlight: true, color: '#00E5FF' },
						{ word: 'LIVIANA', start: 14, end: 24, highlight: true, color: '#00E5FF' },
						{ word: 'PARA', start: 25, end: 29 },
						{ word: 'MANIPULAR', start: 30, end: 44 },
					]}
				/>
				<VerbatimCaption
					startFrame={50}
					durationFrames={26}
					words={[
						{ word: 'PERO', start: 53, end: 57 },
						{ word: 'SOPORTA', start: 56, end: 69, highlight: true, color: '#FFE500' },
						{ word: 'HASTA', start: 70, end: 75 },
					]}
				/>
				<VerbatimCaption
					startFrame={76}
					durationFrames={26}
					words={[
						{ word: 'TRES', start: 76, end: 81, highlight: true, color: '#FFE500' },
						{ word: 'MIL', start: 82, end: 87, highlight: true, color: '#FFE500' },
						{ word: 'QUINIENTOS', start: 88, end: 100, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={102}
					durationFrames={53}
					words={[
						{ word: 'KILOS', start: 102, end: 109, highlight: true, color: '#FFE500' },
						{ word: 'DE', start: 111, end: 113 },
						{ word: 'ARRASTRE', start: 112, end: 155, highlight: true, color: '#00FF66' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 5: DISTANCIA Y CERO CHOQUES (Frames 589 - 751 = 5.40s)         */}
			{/* Spoken: "Mantiene distancia fija de uno punto ocho metros, sin tirones bruscos ni riesgo de choque." */}
			{/* ===================================================================== */}
			<Sequence from={589} durationInFrames={162}>
				<Audio src={staticFile('audio/reel_legal/scene5_seguridad.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={162}
					transformOrigin="50% 62%"
					punches={[{ atFrame: 39, targetScale: 1.15, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_legal/clip5_carretera_legal.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos literales palabra por palabra */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={36}
					words={[
						{ word: 'MANTIENE', start: 3, end: 14 },
						{ word: 'DISTANCIA', start: 15, end: 27, highlight: true, color: '#00FF66' },
						{ word: 'FIJA', start: 27, end: 35, highlight: true, color: '#00FF66' },
					]}
				/>
				<VerbatimCaption
					startFrame={36}
					durationFrames={40}
					words={[
						{ word: 'DE', start: 36, end: 39 },
						{ word: 'UNO', start: 39, end: 44, highlight: true, color: '#00E5FF' },
						{ word: 'PUNTO', start: 46, end: 54, highlight: true, color: '#00E5FF' },
						{ word: 'OCHO', start: 54, end: 60, highlight: true, color: '#00E5FF' },
						{ word: 'METROS', start: 61, end: 72, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={76}
					durationFrames={31}
					words={[
						{ word: 'SIN', start: 78, end: 84 },
						{ word: 'TIRONES', start: 84, end: 93, highlight: true, color: '#FFE500' },
						{ word: 'BRUSCOS', start: 95, end: 105, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={107}
					durationFrames={55}
					words={[
						{ word: 'NI', start: 106, end: 109 },
						{ word: 'RIESGO', start: 109, end: 118, highlight: true, color: '#FF3B30' },
						{ word: 'DE', start: 120, end: 122 },
						{ word: 'CHOQUE', start: 123, end: 162, highlight: true, color: '#FF3B30' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 6: CIERRE OFICIAL FOLLETO 1.PNG (Frames 751 - 932 = 6.03s)      */}
			{/* Spoken: "Cumple la ley y viaja seguro por sesenta y cinco mil pesos. Pídela hoy en Metal Creativo." */}
			{/* Fondo limpio 100% puro sin textos superpuestos                         */}
			{/* ===================================================================== */}
			<Sequence from={751} durationInFrames={181}>
				<Audio src={staticFile('audio/reel_legal/scene6_cierre.mp3')} volume={1.0} />
				<AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
					<Img
						src={staticFile('images/folleto_cierre_oficial.png')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame - 751, [0, 181], [1.0, 1.03], {
								extrapolateRight: 'clamp',
							})})`,
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ===================================================================== */}
			{/* LOGO FLOTANTE MC (DURANTE ACCIÓN, SE OCULTA EN EL FOLLETO FINAL)       */}
			{/* ===================================================================== */}
			<div
				style={{
					position: 'absolute',
					top: 65,
					left: 55,
					zIndex: 90,
					opacity: logoOpacity,
					filter:
						'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 12px rgba(249, 115, 22, 0.4))',
				}}
			>
				<Img
					src={staticFile('images/logo_icon_only_transparent.png')}
					style={{
						width: 105,
						height: 'auto',
						objectFit: 'contain',
					}}
				/>
			</div>

			{/* ===================================================================== */}
			{/* BARRA DE PROGRESO INFERIOR CINEMATOGRÁFICA                            */}
			{/* ===================================================================== */}
			<div
				style={{
					position: 'absolute',
					bottom: 25,
					left: 45,
					right: 45,
					height: 5,
					backgroundColor: 'rgba(255, 255, 255, 0.15)',
					borderRadius: 9999,
					overflow: 'hidden',
					zIndex: 90,
					opacity: logoOpacity,
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${progress}%`,
						background: 'linear-gradient(90deg, #FFE500 0%, #F97316 50%, #FF3B30 100%)',
						borderRadius: 9999,
						boxShadow: '0 0 12px rgba(249, 115, 22, 0.9)',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
