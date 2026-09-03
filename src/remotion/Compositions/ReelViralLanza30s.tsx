import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	interpolate,
	OffthreadVideo,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const ReelViralLanza30s: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso inferior (0 a 100%)
	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Transición del logo persistente (se oculta en la tarjeta final)
	const persistentLogoOpacity = interpolate(frame, [710, 725], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Transición de salida de Scene 1
	const op1 = interpolate(frame, [140, 150], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Transición Scene 2
	const op2 = interpolate(frame, [150, 158, 280, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Transición Scene 3
	const op3 = interpolate(frame, [290, 298, 430, 440], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Transición Scene 4
	const op4 = interpolate(frame, [440, 448, 570, 580], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Transición Scene 5
	const op5 = interpolate(frame, [580, 588, 715, 725], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	// Transición Scene 6 (Cierre)
	const op6 = interpolate(frame, [725, 735], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#0A0C10',
				fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
				color: '#FFFFFF',
				overflow: 'hidden',
			}}
		>
			{/* MÚSICA DE FONDO (30s) */}
			<Audio src={staticFile('audio/reel_opcion1/bg_music_30s.mp3')} volume={0.18} />

			{/* ========================================================================= */}
			{/* WATERMARK PERSISTENTE SUPERIOR IZQUIERDA (Escenas 1 a 5)                 */}
			{/* ========================================================================= */}
			<div
				style={{
					position: 'absolute',
					top: 80,
					left: 50,
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					backgroundColor: 'rgba(15, 18, 26, 0.78)',
					backdropFilter: 'blur(14px)',
					WebkitBackdropFilter: 'blur(14px)',
					padding: '10px 22px 10px 14px',
					borderRadius: 9999,
					border: '1px solid rgba(255, 255, 255, 0.14)',
					boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
					zIndex: 80,
					opacity: persistentLogoOpacity,
				}}
			>
				<Img
					src={staticFile('images/logo_transparent.png')}
					style={{
						height: 44,
						width: 'auto',
						objectFit: 'contain',
						filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
					}}
				/>
				<div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
					<span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.08em', color: '#FFFFFF' }}>
						METAL <span style={{ color: '#F97316' }}>CREATIVO</span>
					</span>
					<span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#94A3B8', textTransform: 'uppercase' }}>
						Chile · Taller Oficial
					</span>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* ESCENA 1: HOOK / IMPACTO (Frames 0 - 150 = 5.0s)                         */}
			{/* ========================================================================= */}
			<Sequence from={0} durationInFrames={150}>
				<Audio src={staticFile('audio/reel_opcion1/vo_1.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op1 }}>
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip1_hook.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame, [0, 150], [1.0, 1.08], { extrapolateRight: 'clamp' })})`,
						}}
					/>
					{/* Gradiente cinemático superior e inferior */}
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'linear-gradient(180deg, rgba(10,12,16,0.7) 0%, rgba(10,12,16,0.1) 35%, rgba(10,12,16,0.2) 60%, rgba(10,12,16,0.88) 100%)',
						}}
					/>

					{/* Badge de Alerta Superior */}
					<div
						style={{
							position: 'absolute',
							top: 170,
							left: 50,
							right: 50,
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(239, 68, 68, 0.95)',
								padding: '12px 26px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(239, 68, 68, 0.55)',
								border: '1px solid rgba(255, 255, 255, 0.25)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.08em', color: '#FFF' }}>
								🚗💥 PRUEBA DE RESISTENCIA REAL
							</span>
						</div>
					</div>

					{/* Hook Inferior (Kinetic Card) */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.88)',
							backdropFilter: 'blur(16px)',
							WebkitBackdropFilter: 'blur(16px)',
							borderRadius: 24,
							padding: '30px 28px',
							border: '1px solid rgba(255, 255, 255, 0.16)',
							boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
						}}
					>
						<div
							style={{
								fontSize: 42,
								fontWeight: 900,
								lineHeight: 1.15,
								letterSpacing: '-0.02em',
								color: '#FFFFFF',
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							¿AGUANTA EL TIRÓN <br />
							<span style={{ color: '#F97316' }}>O SE DOBLA?</span>
						</div>
						<div
							style={{
								fontSize: 22,
								fontWeight: 600,
								color: '#E2E8F0',
								textAlign: 'center',
								lineHeight: 1.3,
							}}
						>
							Pusimos a prueba la barra rígida de <strong style={{ color: '#38BDF8' }}>Metal Creativo</strong>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 2: PIEZAS / COMPACTO (Frames 150 - 290 = 4.67s)                   */}
			{/* ========================================================================= */}
			<Sequence from={150} durationInFrames={140}>
				<Audio src={staticFile('audio/reel_opcion1/vo_2.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op2 }}>
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip2_partes.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame, [150, 290], [1.0, 1.07], { extrapolateRight: 'clamp' })})`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'linear-gradient(180deg, rgba(10,12,16,0.65) 0%, rgba(10,12,16,0.1) 35%, rgba(10,12,16,0.2) 60%, rgba(10,12,16,0.88) 100%)',
						}}
					/>

					{/* Badge Superior */}
					<div style={{ position: 'absolute', top: 170, left: 50, right: 50, display: 'flex', justifyContent: 'center' }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(245, 158, 11, 0.95)',
								padding: '12px 26px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45)',
								border: '1px solid rgba(255, 255, 255, 0.25)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', color: '#000' }}>
								📦 DISEÑO MODULAR PARA MALETERO
							</span>
						</div>
					</div>

					{/* Tarjeta Inferior */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.88)',
							backdropFilter: 'blur(16px)',
							WebkitBackdropFilter: 'blur(16px)',
							borderRadius: 24,
							padding: '30px 28px',
							border: '1px solid rgba(255, 255, 255, 0.16)',
							boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
						}}
					>
						<div
							style={{
								fontSize: 40,
								fontWeight: 900,
								lineHeight: 1.15,
								letterSpacing: '-0.02em',
								color: '#FFFFFF',
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							3 TRAMOS COMPACTOS <br />
							<span style={{ color: '#FBBF24' }}>DE 65 CENTÍMETROS</span>
						</div>
						<div
							style={{
								fontSize: 22,
								fontWeight: 600,
								color: '#E2E8F0',
								textAlign: 'center',
								lineHeight: 1.3,
							}}
						>
							No te quita espacio en la maleta y va siempre lista para emergencias.
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 3: ARMADO RÁPIDO & ACERO (Frames 290 - 440 = 5.0s)                */}
			{/* ========================================================================= */}
			<Sequence from={290} durationInFrames={150}>
				<Audio src={staticFile('audio/reel_opcion1/vo_3.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op3 }}>
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip3_armado.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame, [290, 440], [1.0, 1.07], { extrapolateRight: 'clamp' })})`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'linear-gradient(180deg, rgba(10,12,16,0.65) 0%, rgba(10,12,16,0.1) 35%, rgba(10,12,16,0.2) 60%, rgba(10,12,16,0.88) 100%)',
						}}
					/>

					{/* Badge Superior */}
					<div style={{ position: 'absolute', top: 170, left: 50, right: 50, display: 'flex', justifyContent: 'center' }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(16, 185, 129, 0.95)',
								padding: '12px 26px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
								border: '1px solid rgba(255, 255, 255, 0.25)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', color: '#FFF' }}>
								⚡ ARMADO EN 1 MINUTO (SIN HERRAMIENTAS)
							</span>
						</div>
					</div>

					{/* Tarjeta Inferior */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.88)',
							backdropFilter: 'blur(16px)',
							WebkitBackdropFilter: 'blur(16px)',
							borderRadius: 24,
							padding: '30px 28px',
							border: '1px solid rgba(255, 255, 255, 0.16)',
							boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
						}}
					>
						<div
							style={{
								fontSize: 40,
								fontWeight: 900,
								lineHeight: 1.15,
								letterSpacing: '-0.02em',
								color: '#FFFFFF',
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							ACERO REFORZADO 5 MM <br />
							<span style={{ color: '#34D399' }}>PASADORES CON SEGURO</span>
						</div>
						<div
							style={{
								fontSize: 22,
								fontWeight: 600,
								color: '#E2E8F0',
								textAlign: 'center',
								lineHeight: 1.3,
							}}
						>
							Chavetas de seguridad encadenadas para un enganche ultra firme.
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 4: LIVIANA PERO AGUANTA 3.500 KG (Frames 440 - 580 = 4.67s)       */}
			{/* ========================================================================= */}
			<Sequence from={440} durationInFrames={140}>
				<Audio src={staticFile('audio/reel_opcion1/vo_4.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op4 }}>
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip4_levante.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame, [440, 580], [1.0, 1.07], { extrapolateRight: 'clamp' })})`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'linear-gradient(180deg, rgba(10,12,16,0.65) 0%, rgba(10,12,16,0.1) 35%, rgba(10,12,16,0.2) 60%, rgba(10,12,16,0.88) 100%)',
						}}
					/>

					{/* Badge Superior */}
					<div style={{ position: 'absolute', top: 170, left: 50, right: 50, display: 'flex', justifyContent: 'center' }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(56, 189, 248, 0.95)',
								padding: '12px 26px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(56, 189, 248, 0.45)',
								border: '1px solid rgba(255, 255, 255, 0.25)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', color: '#0F172A' }}>
								⚖️ FÁCIL DE MANIPULAR POR 1 PERSONA
							</span>
						</div>
					</div>

					{/* Tarjeta Inferior */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.88)',
							backdropFilter: 'blur(16px)',
							WebkitBackdropFilter: 'blur(16px)',
							borderRadius: 24,
							padding: '30px 28px',
							border: '1px solid rgba(255, 255, 255, 0.16)',
							boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
						}}
					>
						<div
							style={{
								fontSize: 40,
								fontWeight: 900,
								lineHeight: 1.15,
								letterSpacing: '-0.02em',
								color: '#FFFFFF',
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							SÚPER LIVIANA EN MANO <br />
							<span style={{ color: '#38BDF8' }}>SOPORTA HASTA 3.500 KG</span>
						</div>
						<div
							style={{
								fontSize: 22,
								fontWeight: 600,
								color: '#E2E8F0',
								textAlign: 'center',
								lineHeight: 1.3,
							}}
						>
							Ideal para autos chicos, sedanes familiares, SUVs y camionetas de trabajo.
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 5: DISTANCIA FIJA & CERO CHOQUES (Frames 580 - 725 = 4.83s)        */}
			{/* ========================================================================= */}
			<Sequence from={580} durationInFrames={145}>
				<Audio src={staticFile('audio/reel_opcion1/vo_5.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op5 }}>
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip5_remolque.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${interpolate(frame, [580, 725], [1.0, 1.07], { extrapolateRight: 'clamp' })})`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'linear-gradient(180deg, rgba(10,12,16,0.65) 0%, rgba(10,12,16,0.1) 35%, rgba(10,12,16,0.2) 60%, rgba(10,12,16,0.88) 100%)',
						}}
					/>

					{/* Badge Superior */}
					<div style={{ position: 'absolute', top: 170, left: 50, right: 50, display: 'flex', justifyContent: 'center' }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(239, 68, 68, 0.95)',
								padding: '12px 26px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(239, 68, 68, 0.55)',
								border: '1px solid rgba(255, 255, 255, 0.25)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', color: '#FFF' }}>
								🛡️ CERO CHOQUES POR ALCANCE
							</span>
						</div>
					</div>

					{/* Tarjeta Inferior */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.88)',
							backdropFilter: 'blur(16px)',
							WebkitBackdropFilter: 'blur(16px)',
							borderRadius: 24,
							padding: '30px 28px',
							border: '1px solid rgba(255, 255, 255, 0.16)',
							boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
						}}
					>
						<div
							style={{
								fontSize: 40,
								fontWeight: 900,
								lineHeight: 1.15,
								letterSpacing: '-0.02em',
								color: '#FFFFFF',
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							DISTANCIA FIJA 1.8 M <br />
							<span style={{ color: '#F87171' }}>SIN TIRONES BRUSCOS</span>
						</div>
						<div
							style={{
								fontSize: 22,
								fontWeight: 600,
								color: '#E2E8F0',
								textAlign: 'center',
								lineHeight: 1.3,
							}}
						>
							Cuando el auto de adelante frena, la barra rígida mantiene la separación exacta.
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 6: CIERRE & LLAMADO A LA ACCIÓN (Frames 725 - 900 = 5.83s)         */}
			{/* ========================================================================= */}
			<Sequence from={725} durationInFrames={175}>
				<Audio src={staticFile('audio/reel_opcion1/vo_6.mp3')} volume={1.0} />
				<AbsoluteFill style={{ opacity: op6 }}>
					{/* Video de fondo desenfocado sutil */}
					<OffthreadVideo
						src={staticFile('videos/reel_opcion1/clip6_cierre.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							filter: 'brightness(0.35) blur(6px)',
							transform: 'scale(1.05)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'radial-gradient(circle at center, rgba(15,18,26,0.85) 0%, rgba(10,12,16,0.95) 100%)',
						}}
					/>

					{/* Contenedor Central Hero Card */}
					<div
						style={{
							position: 'absolute',
							top: 100,
							bottom: 100,
							left: 45,
							right: 45,
							backgroundColor: 'rgba(15, 18, 26, 0.94)',
							backdropFilter: 'blur(24px)',
							WebkitBackdropFilter: 'blur(24px)',
							borderRadius: 36,
							padding: '40px 32px',
							border: '2px solid rgba(249, 115, 22, 0.45)',
							boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(249, 115, 22, 0.25)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'space-evenly',
							transform: `scale(${spring({
								frame: frame - 725,
								fps,
								config: { damping: 16, stiffness: 180, mass: 0.5 },
							})})`,
						}}
					>
						{/* Logo Oficial Destacado */}
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
							<Img
								src={staticFile('images/logo_transparent.png')}
								style={{
									height: 100,
									width: 'auto',
									objectFit: 'contain',
									filter: 'drop-shadow(0 8px 24px rgba(249, 115, 22, 0.5))',
								}}
							/>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: 8,
									backgroundColor: 'rgba(255, 255, 255, 0.08)',
									padding: '6px 20px',
									borderRadius: 9999,
									border: '1px solid rgba(255, 255, 255, 0.14)',
								}}
							>
								<span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.12em', color: '#F97316' }}>
									🇨🇱 FABRICACIÓN 100% NACIONAL
								</span>
							</div>
						</div>

						{/* Foto Real de la Lanza en 3 tramos */}
						<div style={{ width: '100%', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.18)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
							<Img
								src={staticFile('images/lanza_3tramos_real.jpeg')}
								style={{
									width: '100%',
									height: 240,
									objectFit: 'cover',
								}}
							/>
						</div>

						{/* Producto & Specs */}
						<div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
							<div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
								BARRA RÍGIDA DE REMOLQUE
							</div>
							<div style={{ fontSize: 19, color: '#94A3B8', fontWeight: 600 }}>
								Cumple Decreto N° 55 MTT · Acero Reforzado 5 mm
							</div>

							{/* Lista de Ventajas Clave */}
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: 8,
									backgroundColor: 'rgba(255, 255, 255, 0.04)',
									padding: '14px 20px',
									borderRadius: 18,
									border: '1px solid rgba(255, 255, 255, 0.08)',
									marginTop: 4,
								}}
							>
								<div style={{ fontSize: 18, fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
									<span style={{ color: '#10B981' }}>✓</span> 3 tramos compactos (65 cm para el maletero)
								</div>
								<div style={{ fontSize: 18, fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
									<span style={{ color: '#10B981' }}>✓</span> Soporta hasta 3.500 kg de arrastre
								</div>
								<div style={{ fontSize: 18, fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
									<span style={{ color: '#10B981' }}>✓</span> Pasadores de seguridad (armado en 1 min)
								</div>
							</div>

							{/* Caja de Precio Oficial */}
							<div
								style={{
									marginTop: 6,
									backgroundColor: 'rgba(249, 115, 22, 0.14)',
									border: '1px solid rgba(249, 115, 22, 0.4)',
									borderRadius: 20,
									padding: '14px 24px',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div style={{ textAlign: 'left' }}>
									<div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em', color: '#CBD5E1' }}>
										PRECIO OFICIAL CHILE
									</div>
									<div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>
										Incluye los 3 tramos + pasadores
									</div>
								</div>
								<div style={{ fontSize: 48, fontWeight: 900, color: '#F97316', letterSpacing: '-0.02em' }}>
									$65.000 <span style={{ fontSize: 20, color: '#E2E8F0' }}>CLP</span>
								</div>
							</div>
						</div>

						{/* Envíos & Botón CTA */}
						<div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
							<div style={{ fontSize: 17, fontWeight: 600, color: '#CBD5E1', textAlign: 'center' }}>
								📦 Despachos rápidos a todo Chile por <strong style={{ color: '#FFF' }}>Starken y Chilexpress</strong>
							</div>

							{/* Botón WhatsApp / Web con pulso sutil */}
							<div
								style={{
									width: '100%',
									backgroundColor: '#25D366',
									color: '#07180D',
									padding: '18px 20px',
									borderRadius: 18,
									fontWeight: 900,
									fontSize: 22,
									letterSpacing: '0.02em',
									textAlign: 'center',
									boxShadow: '0 10px 30px rgba(37, 211, 102, 0.45)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 10,
									transform: `scale(${interpolate(
										(frame - 725) % 30,
										[0, 15, 30],
										[1.0, 1.03, 1.0],
										{ easing: Easing.inOut(Easing.ease) }
									)})`,
								}}
							>
								<span>📲 PÍDELA AL WHATSAPP O EN EL LINK DEL PERFIL</span>
							</div>
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
					bottom: 40,
					left: 50,
					right: 50,
					height: 6,
					backgroundColor: 'rgba(255, 255, 255, 0.18)',
					borderRadius: 9999,
					overflow: 'hidden',
					zIndex: 90,
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${progress}%`,
						background: 'linear-gradient(90deg, #F97316 0%, #EF4444 100%)',
						borderRadius: 9999,
						boxShadow: '0 0 12px rgba(249, 115, 22, 0.8)',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
