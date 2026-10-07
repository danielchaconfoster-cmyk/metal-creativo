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
// 1. SUBTÍTULOS KINÉTICOS VERBATIM (SIN CAJAS, FLOTANDO SOBRE EL VIDEO CON STROKE)
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
	topPercent = 26,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	if (frame < startFrame || frame >= startFrame + durationFrames) {
		return null;
	}

	const localFrame = frame - startFrame;

	// Rebote elástico táctil y firme (Walter Murch / Apple Spring)
	const scale = spring({
		frame: localFrame,
		fps,
		config: {
			damping: 14,
			stiffness: 260,
			mass: 0.35,
		},
	});

	// Desvanecimiento suave al salir del chunk
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
// 2. COTA TÉCNICA DE MEDICIÓN (VECTORIAL PURA, SIN FONDOS NI CAJAS)
// =============================================================================
interface PureDimensionProps {
	label: string;
	yPercent?: number;
	startFrame: number;
	durationFrames: number;
	color?: string;
}

const PureDimensionRuler: React.FC<PureDimensionProps> = ({
	label,
	yPercent = 65,
	startFrame,
	durationFrames,
	color = '#00E5FF',
}) => {
	const frame = useCurrentFrame();
	if (frame < startFrame || frame >= startFrame + durationFrames) return null;

	const local = frame - startFrame;
	const progress = interpolate(local, [0, 10], [0, 1], {
		extrapolateRight: 'clamp',
	});
	const opacity = interpolate(
		local,
		[0, 6, durationFrames - 6, durationFrames],
		[0, 1, 1, 0],
		{ extrapolateRight: 'clamp' }
	);

	return (
		<div
			style={{
				position: 'absolute',
				top: `${yPercent}%`,
				left: 80,
				right: 80,
				opacity,
				zIndex: 80,
				pointerEvents: 'none',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			{/* Etiqueta de medición: Flota limpia sobre el video con contorno negro (CERO CAJA) */}
			<div
				style={{
					fontFamily: '"Montserrat", "Arial Black", sans-serif',
					fontSize: 48,
					fontWeight: 900,
					color: '#FFE500',
					letterSpacing: '0.08em',
					textTransform: 'uppercase',
					WebkitTextStroke: '4px #000000',
					paintOrder: 'stroke fill',
					textShadow: '0 5px 0 #000000, 0 8px 25px rgba(0, 0, 0, 0.95)',
					marginBottom: 6,
				}}
			>
				{label}
			</div>

			{/* Línea vectorial de cota técnica con topes perpendiculares */}
			<div
				style={{
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					transform: `scaleX(${progress})`,
					transformOrigin: 'center center',
				}}
			>
				{/* Tope izquierdo */}
				<div
					style={{
						width: 4,
						height: 28,
						backgroundColor: color,
						boxShadow: `0 0 10px ${color}`,
					}}
				/>
				{/* Línea central */}
				<div
					style={{
						flex: 1,
						height: 3,
						backgroundColor: color,
						boxShadow: `0 0 8px ${color}`,
					}}
				/>
				{/* Tope derecho */}
				<div
					style={{
						width: 4,
						height: 28,
						backgroundColor: color,
						boxShadow: `0 0 10px ${color}`,
					}}
				/>
			</div>
		</div>
	);
};

// =============================================================================
// 3. CÁMARA CINEMÁTICA CON PUNCH-IN ZOOMS Y SHAKE (MICRO-VIBRACIÓN DE FUERZA)
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
// 4. COMPOSICIÓN MAESTRA REEL 02: "¿AGUANTA EL TIRÓN O SE DOBLA?" (33.73s - 1012 FRAMES)
// =============================================================================
export const Reel02Cinematico: React.FC = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// Barra de progreso inferior discreta
	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Opacidad del logo flotante y de la barra de progreso (se ocultan para dejar la lámina 1.png 100% limpia)
	// La escena final comienza en el frame 838
	const logoOpacity = interpolate(frame, [825, 838], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Color grading cinematográfico profesional de taller
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
				@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap');
			`}</style>

			{/* ===================================================================== */}
			{/* ESCENA 1: HOOK DE TENSIÓN (Frames 0 - 167 = 5.57s)                    */}
			{/* Spoken: "¿Aguanta el tirón o se dobla? Pusimos a prueba la barra de remolque de Metal Creativo." */}
			{/* ===================================================================== */}
			<Sequence from={0} durationInFrames={167}>
				<Audio src={staticFile('audio/reel_02/scene1_hook.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={167}
					transformOrigin="50% 50%"
					punches={[]}
					shakeAt={[]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_02/clip1_hook.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: cinematicGrade,
						}}
					/>
				</CinematicCamera>

				{/* Viñeta sutil para contraste */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)',
					}}
				/>

				{/* Subtítulos Verbatim exactos sincronizados palabra por palabra (SIN CAJAS) */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={25}
					words={[
						{ word: '¿AGUANTA', start: 3, end: 13 },
						{ word: 'EL', start: 13, end: 16 },
						{ word: 'TIRÓN', start: 17, end: 24, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={25}
					durationFrames={35}
					words={[
						{ word: 'O', start: 25, end: 27 },
						{ word: 'SE', start: 27, end: 30 },
						{ word: 'DOBLA?', start: 31, end: 39, highlight: true, color: '#FF3B30' },
					]}
				/>
				<VerbatimCaption
					startFrame={60}
					durationFrames={28}
					words={[
						{ word: 'PUSIMOS', start: 64, end: 76 },
						{ word: 'A', start: 76, end: 78 },
						{ word: 'PRUEBA', start: 80, end: 87, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={88}
					durationFrames={24}
					words={[
						{ word: 'LA', start: 86, end: 88 },
						{ word: 'BARRA', start: 90, end: 96, highlight: true, color: '#FFE500' },
						{ word: 'DE', start: 97, end: 99 },
						{ word: 'REMOLQUE', start: 100, end: 111, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={112}
					durationFrames={55}
					words={[
						{ word: 'DE', start: 112, end: 114 },
						{ word: 'METAL', start: 115, end: 123, highlight: true, color: '#F97316' },
						{ word: 'CREATIVO', start: 124, end: 135, highlight: true, color: '#F97316' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 2: 3 TRAMOS COMPACTOS (Frames 167 - 329 = 5.40s)                */}
			{/* Spoken: "Viene en tres tramos compactos de sesenta y cinco centímetros para no quitarte espacio en la maleta." */}
			{/* ===================================================================== */}
			<Sequence from={167} durationInFrames={162}>
				<Audio src={staticFile('audio/reel_02/scene2_tramos.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={162}
					transformOrigin="50% 65%"
					punches={[{ atFrame: 28, targetScale: 1.12, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_02/clip2_tramos.mp4')}
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

				{/* Cota Técnica de Medición: 65 CM (Línea pura sin caja) */}
				<PureDimensionRuler
					label="65 CM"
					yPercent={68}
					startFrame={27}
					durationFrames={65}
					color="#00E5FF"
				/>

				{/* Subtítulos Verbatim exactos */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={27}
					words={[
						{ word: 'VIENE', start: 3, end: 10 },
						{ word: 'EN', start: 10, end: 13 },
						{ word: 'TRES', start: 14, end: 19, highlight: true, color: '#FFE500' },
						{ word: 'TRAMOS', start: 20, end: 27, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={27}
					durationFrames={54}
					words={[
						{ word: 'COMPACTOS', start: 28, end: 40, highlight: true, color: '#00E5FF' },
						{ word: 'DE', start: 41, end: 43 },
						{ word: 'SESENTA', start: 43, end: 53 },
						{ word: 'Y', start: 53, end: 55 },
						{ word: 'CINCO', start: 54, end: 62 },
						{ word: 'CENTÍMETROS', start: 63, end: 80, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={81}
					durationFrames={33}
					words={[
						{ word: 'PARA', start: 82, end: 87 },
						{ word: 'NO', start: 87, end: 90 },
						{ word: 'QUITARTE', start: 91, end: 101 },
						{ word: 'ESPACIO', start: 103, end: 114, highlight: true, color: '#00FF66' },
					]}
				/>
				<VerbatimCaption
					startFrame={114}
					durationFrames={48}
					words={[
						{ word: 'EN', start: 113, end: 115 },
						{ word: 'LA', start: 116, end: 118 },
						{ word: 'MALETA', start: 119, end: 131, highlight: true, color: '#00FF66' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 3: ACERO 3MM & PASADOR CON SEGURO (Frames 329 - 513 = 6.13s)     */}
			{/* Spoken: "Tubo de acero reforzado de tres milímetros y pasadores de seguridad. Se arma en un minuto." */}
			{/* ===================================================================== */}
			<Sequence from={329} durationInFrames={184}>
				<Audio src={staticFile('audio/reel_02/scene3_acero.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={184}
					transformOrigin="50% 55%"
					punches={[
						{ atFrame: 47, targetScale: 1.14, decayDuration: 30 },
						{ atFrame: 128, targetScale: 1.12, decayDuration: 25 },
					]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_02/clip3_armado.mp4')}
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

				{/* Subtítulos Verbatim exactos (Sin cajas, el foco está en la acción de armado real) */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={35}
					words={[
						{ word: 'TUBO', start: 3, end: 9 },
						{ word: 'DE', start: 9, end: 11 },
						{ word: 'ACERO', start: 12, end: 20, highlight: true, color: '#00E5FF' },
						{ word: 'REFORZADO', start: 21, end: 35, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={35}
					durationFrames={28}
					words={[
						{ word: 'DE', start: 35, end: 37 },
						{ word: 'TRES', start: 38, end: 46, highlight: true, color: '#FFE500' },
						{ word: 'MILÍMETROS', start: 47, end: 62, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={63}
					durationFrames={45}
					words={[
						{ word: 'Y', start: 62, end: 64 },
						{ word: 'PASADORES', start: 65, end: 79, highlight: true, color: '#00E5FF' },
						{ word: 'DE', start: 79, end: 81 },
						{ word: 'SEGURIDAD', start: 82, end: 97, highlight: true, color: '#00FF66' },
					]}
				/>
				<VerbatimCaption
					startFrame={118}
					durationFrames={66}
					words={[
						{ word: 'SE', start: 122, end: 128 },
						{ word: 'ARMA', start: 128, end: 135, highlight: true, color: '#00FF66' },
						{ word: 'EN', start: 136, end: 138 },
						{ word: 'UN', start: 138, end: 141 },
						{ word: 'MINUTO', start: 142, end: 153, highlight: true, color: '#FFE500' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 4: PRUEBA DE FUERZA Y 3.500 KG (Frames 513 - 669 = 5.20s)        */}
			{/* Spoken: "Súper liviana para manipular, pero soporta hasta tres mil quinientos kilos de arrastre." */}
			{/* ===================================================================== */}
			<Sequence from={513} durationInFrames={156}>
				<Audio src={staticFile('audio/reel_02/scene4_resistencia.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={156}
					transformOrigin="50% 50%"
					punches={[{ atFrame: 88, targetScale: 1.12, decayDuration: 30 }]}
					shakeAt={[]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_02/clip4_resistencia.mp4')}
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

				{/* Subtítulos Verbatim exactos (Sin cajas, el foco está en la prueba de fuerza en terreno) */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={25}
					words={[
						{ word: 'SÚPER', start: 3, end: 13, highlight: true, color: '#00E5FF' },
						{ word: 'LIVIANA', start: 14, end: 24, highlight: true, color: '#00E5FF' },
					]}
				/>
				<VerbatimCaption
					startFrame={25}
					durationFrames={27}
					words={[
						{ word: 'PARA', start: 25, end: 29 },
						{ word: 'MANIPULAR', start: 30, end: 44, highlight: true, color: '#FFFFFF' },
					]}
				/>
				<VerbatimCaption
					startFrame={52}
					durationFrames={23}
					words={[
						{ word: 'PERO', start: 53, end: 57 },
						{ word: 'SOPORTA', start: 56, end: 69, highlight: true, color: '#FFE500' },
						{ word: 'HASTA', start: 70, end: 75 },
					]}
				/>
				<VerbatimCaption
					startFrame={75}
					durationFrames={35}
					words={[
						{ word: 'TRES', start: 76, end: 81, highlight: true, color: '#FFE500' },
						{ word: 'MIL', start: 82, end: 87, highlight: true, color: '#FFE500' },
						{ word: 'QUINIENTOS', start: 88, end: 100, highlight: true, color: '#FFE500' },
						{ word: 'KILOS', start: 102, end: 109, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={110}
					durationFrames={46}
					words={[
						{ word: 'DE', start: 111, end: 113 },
						{ word: 'ARRASTRE', start: 112, end: 124, highlight: true, color: '#FF3B30' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 5: DISTANCIA FIJA 1.8M (Frames 669 - 838 = 5.63s)               */}
			{/* Spoken: "Distancia fija de uno punto ocho metros, sin tirones bruscos ni riesgo de choque por alcance." */}
			{/* ===================================================================== */}
			<Sequence from={669} durationInFrames={169}>
				<Audio src={staticFile('audio/reel_02/scene5_distancia.mp3')} volume={1.0} />
				<CinematicCamera
					sceneDuration={169}
					transformOrigin="50% 60%"
					punches={[{ atFrame: 49, targetScale: 1.12, decayDuration: 30 }]}
				>
					<OffthreadVideo
						src={staticFile('videos/reel_02/clip5_distancia.mp4')}
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

				{/* Cota Arquitectónica entre Vehículos: 1.8 METROS (Línea pura sin caja) */}
				<PureDimensionRuler
					label="1.8 METROS FIJOS"
					yPercent={66}
					startFrame={26}
					durationFrames={65}
					color="#00FF66"
				/>

				{/* Subtítulos Verbatim exactos */}
				<VerbatimCaption
					startFrame={0}
					durationFrames={26}
					words={[
						{ word: 'DISTANCIA', start: 3, end: 17, highlight: true, color: '#00FF66' },
						{ word: 'FIJA', start: 17, end: 25, highlight: true, color: '#00FF66' },
					]}
				/>
				<VerbatimCaption
					startFrame={26}
					durationFrames={39}
					words={[
						{ word: 'DE', start: 25, end: 27 },
						{ word: 'UNO', start: 28, end: 33, highlight: true, color: '#FFE500' },
						{ word: 'PUNTO', start: 35, end: 43, highlight: true, color: '#FFE500' },
						{ word: 'OCHO', start: 43, end: 48, highlight: true, color: '#FFE500' },
						{ word: 'METROS', start: 49, end: 60, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={65}
					durationFrames={29}
					words={[
						{ word: 'SIN', start: 67, end: 73 },
						{ word: 'TIRONES', start: 73, end: 82, highlight: true, color: '#FFE500' },
						{ word: 'BRUSCOS', start: 83, end: 93, highlight: true, color: '#FFE500' },
					]}
				/>
				<VerbatimCaption
					startFrame={94}
					durationFrames={26}
					words={[
						{ word: 'NI', start: 94, end: 97 },
						{ word: 'RIESGO', start: 98, end: 107, highlight: true, color: '#FF3B30' },
						{ word: 'DE', start: 108, end: 110 },
						{ word: 'CHOQUE', start: 112, end: 119, highlight: true, color: '#FF3B30' },
					]}
				/>
				<VerbatimCaption
					startFrame={120}
					durationFrames={49}
					words={[
						{ word: 'POR', start: 121, end: 124 },
						{ word: 'ALCANCE', start: 124, end: 137, highlight: true, color: '#FF3B30' },
					]}
				/>
			</Sequence>

			{/* ===================================================================== */}
			{/* ESCENA 6: CIERRE VERTICAL (FOLLETO 1.PNG LIMPIO AL 100%)              */}
			{/* Frames 838 - 1012 = 5.80s                                             */}
			{/* Spoken: "Fabricación cien por ciento chilena. Pídela hoy al WhatsApp o en el link de nuestro perfil." */}
			{/* ===================================================================== */}
			<Sequence from={838} durationInFrames={174}>
				<Audio src={staticFile('audio/reel_02/scene6_cierre.mp3')} volume={1.0} />
				<AbsoluteFill style={{ backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/folleto_cierre_oficial.png')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ===================================================================== */}
			{/* LOGO FLOTANTE OFICIAL MC (SOLO DURANTE ACCIÓN, DESAPARECE EN EL CIERRE) */}
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
			{/* BARRA DE PROGRESO INFERIOR (DESAPARECE EN EL CIERRE FINAL)            */}
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
					zIndex: 100,
					opacity: logoOpacity,
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${progress}%`,
						background: 'linear-gradient(90deg, #FFE500 0%, #F97316 50%, #FF3B30 100%)',
						borderRadius: 9999,
						boxShadow: '0 0 10px rgba(249, 115, 22, 0.8)',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
