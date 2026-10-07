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

// Componente para subtítulo cinemático viral con rebote dinámico estilo CapCut/Hormozi
interface KineticCaptionProps {
	text: string;
	highlightWord?: string;
	highlightColor?: string;
	startFrame: number;
	durationFrames: number;
}

const KineticCaption: React.FC<KineticCaptionProps> = ({
	text,
	highlightWord,
	highlightColor = '#FFE500',
	startFrame,
	durationFrames,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	if (frame < startFrame || frame >= startFrame + durationFrames) {
		return null;
	}

	const localFrame = frame - startFrame;

	// Rebote de entrada elástico
	const scale = spring({
		frame: localFrame,
		fps,
		config: {
			damping: 10,
			stiffness: 240,
			mass: 0.35,
		},
	});

	// Suave desvanecimiento solo en los últimos 4 frames
	const opacity = interpolate(
		localFrame,
		[durationFrames - 4, durationFrames],
		[1, 0],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
	);

	const words = text.split(' ');

	return (
		<div
			style={{
				position: 'absolute',
				top: '52%',
				left: 40,
				right: 40,
				transform: `translateY(-50%) scale(${scale})`,
				opacity,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '12px 18px',
				zIndex: 80,
				pointerEvents: 'none',
			}}
		>
			{words.map((word, i) => {
				const cleanWord = word.replace(/[¿?¡!.,]/g, '').toUpperCase();
				const isHighlighted = highlightWord && cleanWord.includes(highlightWord.toUpperCase());

				return (
					<span
						key={i}
						style={{
							fontFamily: '"Montserrat", "Impact", "Arial Black", sans-serif',
							fontSize: 58,
							fontWeight: 900,
							letterSpacing: '-0.01em',
							textTransform: 'uppercase',
							color: isHighlighted ? highlightColor : '#FFFFFF',
							WebkitTextStroke: '4px #000000',
							paintOrder: 'stroke fill',
							textShadow:
								'0 6px 0 #000000, 0 10px 25px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0,0,0,0.8)',
							transform: isHighlighted ? 'scale(1.08)' : 'scale(1.0)',
							display: 'inline-block',
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};

export const ReelViralLanza30s: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso inferior
	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Opacidad del logo flotante persistente (se oculta en la tarjeta final)
	const persistentLogoOpacity = interpolate(frame, [715, 725], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#000000',
				fontFamily: '"Montserrat", "Impact", -apple-system, sans-serif',
				color: '#FFFFFF',
				overflow: 'hidden',
			}}
		>
			{/* IMPORTACIÓN DE FUENTES VIRALES GOOGLE FONTS */}
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
			`}</style>

			{/* MÚSICA DE FONDO ENERGÉTICA */}
			<Audio src={staticFile('audio/reel_opcion1/bg_music_30s.mp3')} volume={0.16} />

			{/* ========================================================================= */}
			{/* LOGO FLOTANTE TRANSPARENTE (SOLO PARTE GRÁFICA, SIN CAJAS NI FONDOS)     */}
			{/* ========================================================================= */}
			<div
				style={{
					position: 'absolute',
					top: 75,
					left: 55,
					zIndex: 90,
					opacity: persistentLogoOpacity,
					filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 12px rgba(249, 115, 22, 0.35))',
				}}
			>
				<Img
					src={staticFile('images/logo_icon_only_transparent.png')}
					style={{
						width: 110,
						height: 'auto',
						objectFit: 'contain',
					}}
				/>
			</div>

			{/* ========================================================================= */}
			{/* ESCENA 1: HOOK / PRUEBA DE FUERZA (Frames 0 - 150 = 5.0s)                */}
			{/* ========================================================================= */}
			<Sequence from={0} durationInFrames={150}>
				<Audio src={staticFile('audio/reel_opcion1/vo_1.mp3')} volume={1.0} />
				<OffthreadVideo
					src={staticFile('videos/reel_opcion1/clip1_hook.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${interpolate(frame, [0, 150], [1.0, 1.07], { extrapolateRight: 'clamp' })})`,
					}}
				/>
				{/* Sombra cinemática central para que el texto resalte al 100% sin cajas */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
					}}
				/>
			</Sequence>

			{/* Subtítulos cinemáticos palabra por palabra / Chunks Escena 1 */}
			<KineticCaption
				text="¿AGUANTA EL TIRÓN"
				highlightWord="TIRÓN"
				highlightColor="#FFE500"
				startFrame={0}
				durationFrames={36}
			/>
			<KineticCaption
				text="O SE DOBLA?"
				highlightWord="DOBLA"
				highlightColor="#FF3B30"
				startFrame={36}
				durationFrames={36}
			/>
			<KineticCaption
				text="PUSIMOS A PRUEBA"
				highlightWord="PRUEBA"
				highlightColor="#00E5FF"
				startFrame={72}
				durationFrames={38}
			/>
			<KineticCaption
				text="LA BARRA DE METAL CREATIVO"
				highlightWord="METAL"
				highlightColor="#FF9500"
				startFrame={110}
				durationFrames={40}
			/>

			{/* ========================================================================= */}
			{/* ESCENA 2: COMPACTO / MALETERO (Frames 150 - 290 = 4.67s)                  */}
			{/* ========================================================================= */}
			<Sequence from={150} durationInFrames={140}>
				<Audio src={staticFile('audio/reel_opcion1/vo_2.mp3')} volume={1.0} />
				<OffthreadVideo
					src={staticFile('videos/reel_opcion1/clip2_partes.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${interpolate(frame, [150, 290], [1.0, 1.06], { extrapolateRight: 'clamp' })})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
					}}
				/>
			</Sequence>

			{/* Chunks Escena 2 */}
			<KineticCaption
				text="3 TRAMOS COMPACTOS"
				highlightWord="COMPACTOS"
				highlightColor="#FFE500"
				startFrame={150}
				durationFrames={45}
			/>
			<KineticCaption
				text="DE 65 CENTÍMETROS"
				highlightWord="65"
				highlightColor="#00E5FF"
				startFrame={195}
				durationFrames={45}
			/>
			<KineticCaption
				text="PARA TU MALETERO"
				highlightWord="MALETERO"
				highlightColor="#00FF66"
				startFrame={240}
				durationFrames={50}
			/>

			{/* ========================================================================= */}
			{/* ESCENA 3: ARMADO RÁPIDO & ACERO (Frames 290 - 440 = 5.0s)                */}
			{/* ========================================================================= */}
			<Sequence from={290} durationInFrames={150}>
				<Audio src={staticFile('audio/reel_opcion1/vo_3.mp3')} volume={1.0} />
				<OffthreadVideo
					src={staticFile('videos/reel_opcion1/clip3_armado.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${interpolate(frame, [290, 440], [1.0, 1.06], { extrapolateRight: 'clamp' })})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
					}}
				/>
			</Sequence>

			{/* Chunks Escena 3 */}
			<KineticCaption
				text="ACERO REFORZADO 3 MM"
				highlightWord="3"
				highlightColor="#00E5FF"
				startFrame={290}
				durationFrames={48}
			/>
			<KineticCaption
				text="PASADORES CON SEGURO"
				highlightWord="SEGURO"
				highlightColor="#FFE500"
				startFrame={338}
				durationFrames={48}
			/>
			<KineticCaption
				text="SE ARMA EN 1 MINUTO"
				highlightWord="1"
				highlightColor="#00FF66"
				startFrame={386}
				durationFrames={54}
			/>

			{/* ========================================================================= */}
			{/* ESCENA 4: LIVIANA PERO AGUANTA 3.500 KG (Frames 440 - 580 = 4.67s)       */}
			{/* ========================================================================= */}
			<Sequence from={440} durationInFrames={140}>
				<Audio src={staticFile('audio/reel_opcion1/vo_4.mp3')} volume={1.0} />
				<OffthreadVideo
					src={staticFile('videos/reel_opcion1/clip4_levante.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${interpolate(frame, [440, 580], [1.0, 1.06], { extrapolateRight: 'clamp' })})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
					}}
				/>
			</Sequence>

			{/* Chunks Escena 4 */}
			<KineticCaption
				text="SÚPER LIVIANA EN MANO"
				highlightWord="LIVIANA"
				highlightColor="#00E5FF"
				startFrame={440}
				durationFrames={45}
			/>
			<KineticCaption
				text="PERO SOPORTA"
				highlightWord="SOPORTA"
				highlightColor="#FFFFFF"
				startFrame={485}
				durationFrames={40}
			/>
			<KineticCaption
				text="¡HASTA 3.500 KILOS!"
				highlightWord="3.500"
				highlightColor="#FFE500"
				startFrame={525}
				durationFrames={55}
			/>

			{/* ========================================================================= */}
			{/* ESCENA 5: DISTANCIA FIJA (Frames 580 - 725 = 4.83s)                      */}
			{/* ========================================================================= */}
			<Sequence from={580} durationInFrames={145}>
				<Audio src={staticFile('audio/reel_opcion1/vo_5.mp3')} volume={1.0} />
				<OffthreadVideo
					src={staticFile('videos/reel_opcion1/clip5_remolque.mp4')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${interpolate(frame, [580, 725], [1.0, 1.06], { extrapolateRight: 'clamp' })})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
					}}
				/>
			</Sequence>

			{/* Chunks Escena 5 */}
			<KineticCaption
				text="DISTANCIA FIJA 1.8 M"
				highlightWord="1.8"
				highlightColor="#00FF66"
				startFrame={580}
				durationFrames={45}
			/>
			<KineticCaption
				text="SIN TIRONES BRUSCOS"
				highlightWord="TIRONES"
				highlightColor="#FFE500"
				startFrame={625}
				durationFrames={45}
			/>
			<KineticCaption
				text="¡CERO CHOQUES POR ALCANCE!"
				highlightWord="CERO"
				highlightColor="#FF3B30"
				startFrame={670}
				durationFrames={55}
			/>

			{/* ========================================================================= */}
			{/* ESCENA 6: CIERRE / OFERTA DIRECTA (Frames 725 - 900 = 5.83s)             */}
			{/* ========================================================================= */}
			<Sequence from={725} durationInFrames={175}>
				<Audio src={staticFile('audio/reel_opcion1/vo_6.mp3')} volume={1.0} />
				<AbsoluteFill>
					{/* Video de fondo con desenfoque suave */}
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip6_cierre.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'brightness(0.35) blur(8px)',
							transform: 'scale(1.05)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'radial-gradient(circle at center, rgba(10,12,16,0.85) 0%, rgba(5,6,9,0.96) 100%)',
						}}
					/>

					{/* Contenido limpio de cierre */}
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '60px 45px',
							gap: 24,
							transform: `scale(${spring({
								frame: frame - 725,
								fps,
								config: { damping: 14, stiffness: 200, mass: 0.4 },
							})})`,
						}}
					>
						{/* Logo 3D Puro y Limpio (Solo símbolo) */}
						<Img
							src={staticFile('images/logo_icon_only_transparent.png')}
							style={{
								width: 160,
								height: 'auto',
								objectFit: 'contain',
								filter: 'drop-shadow(0 10px 30px rgba(249, 115, 22, 0.6))',
							}}
						/>

						{/* Marca */}
						<div
							style={{
								fontFamily: '"Montserrat", sans-serif',
								fontSize: 38,
								fontWeight: 900,
								letterSpacing: '0.08em',
								color: '#FFFFFF',
								textShadow: '0 4px 15px rgba(0,0,0,0.8)',
							}}
						>
							METAL <span style={{ color: '#F97316' }}>CREATIVO</span>
						</div>

						{/* Foto de la barra */}
						<div
							style={{
								width: '100%',
								maxWidth: 520,
								borderRadius: 24,
								overflow: 'hidden',
								border: '2px solid rgba(255, 255, 255, 0.25)',
								boxShadow: '0 15px 40px rgba(0, 0, 0, 0.85)',
							}}
						>
							<Img
								src={staticFile('images/lanza_3tramos_real.jpeg')}
								style={{
									width: '100%',
									height: 220,
									objectFit: 'cover',
								}}
							/>
						</div>

						{/* Precio de Impacto */}
						<div
							style={{
								textAlign: 'center',
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
							}}
						>
							<div
								style={{
									fontSize: 22,
									fontWeight: 800,
									letterSpacing: '0.12em',
									color: '#94A3B8',
									textTransform: 'uppercase',
								}}
							>
								Barra Rígida de Remolque
							</div>
							<div
								style={{
									fontSize: 68,
									fontWeight: 900,
									color: '#F97316',
									letterSpacing: '-0.03em',
									textShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
								}}
							>
								$65.000 <span style={{ fontSize: 28, color: '#FFFFFF' }}>CLP</span>
							</div>
							<div style={{ fontSize: 18, color: '#CBD5E1', fontWeight: 600 }}>
								🇨🇱 Fabricación Chilena · Starken / Chilexpress
							</div>
						</div>

						{/* Botón WhatsApp Viral con pulso */}
						<div
							style={{
								marginTop: 8,
								width: '100%',
								maxWidth: 520,
								backgroundColor: '#25D366',
								color: '#07180D',
								padding: '22px 26px',
								borderRadius: 22,
								fontWeight: 900,
								fontSize: 24,
								letterSpacing: '0.01em',
								textAlign: 'center',
								boxShadow: '0 12px 35px rgba(37, 211, 102, 0.55)',
								transform: `scale(${interpolate(
									(frame - 725) % 25,
									[0, 12, 25],
									[1.0, 1.04, 1.0]
								)})`,
							}}
						>
							📲 PÍDELA AL WHATSAPP (LINK EN BIO)
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* BARRA DE PROGRESO INFERIOR CINEMATOGRÁFICA                                */}
			{/* ========================================================================= */}
			<div
				style={{
					position: 'absolute',
					bottom: 35,
					left: 50,
					right: 50,
					height: 6,
					backgroundColor: 'rgba(255, 255, 255, 0.2)',
					borderRadius: 9999,
					overflow: 'hidden',
					zIndex: 100,
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${progress}%`,
						background: 'linear-gradient(90deg, #FFE500 0%, #F97316 50%, #FF3B30 100%)',
						borderRadius: 9999,
						boxShadow: '0 0 14px rgba(249, 115, 22, 0.9)',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
