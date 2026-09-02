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

export const LanzaRealShowcase: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Barra de progreso inferior
	const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateRight: 'clamp',
	});

	// Transiciones de escenas (450 frames = 15s)
	// Escena 1: 0 - 105 (0 - 3.5s) -> Video Real en Ruta
	const opacity1 = interpolate(frame, [85, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring1 = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });

	// Escena 2: 95 - 215 (3.2 - 7.1s) -> Foto Real Lanza Armada Maciza
	const opacity2 = interpolate(frame, [95, 110, 195, 215], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring2 = spring({ frame: frame - 95, fps, config: { damping: 14, mass: 0.7 } });

	// Escena 3: 205 - 325 (6.8 - 10.8s) -> Foto Real Desarmada en 3 Partes
	const opacity3 = interpolate(frame, [205, 220, 305, 325], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring3 = spring({ frame: frame - 205, fps, config: { damping: 14, mass: 0.7 } });

	// Escena 4: 315 - 400 (10.5 - 13.3s) -> Foto Real Enganchada en Auto + Envíos Mercado Libre
	const opacity4 = interpolate(frame, [315, 330, 385, 400], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring4 = spring({ frame: frame - 315, fps, config: { damping: 14, mass: 0.7 } });

	// Escena 5: 390 - 450 (13.0 - 15.0s) -> Cierre con Logo, Precio y WhatsApp CTA
	const opacity5 = interpolate(frame, [390, 405], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const spring5 = spring({ frame: frame - 390, fps, config: { damping: 14, mass: 0.7 } });

	return (
		<AbsoluteFill style={{ backgroundColor: '#07090E', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#FFFFFF', overflow: 'hidden' }}>
			{/* AUDIO DE FONDO */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.85} />

			{/* ========================================================================= */}
			{/* ESCENA 1: VIDEO REAL DE REMOLQUE EN ACCIÓN (0 - 3.5s)                     */}
			{/* ========================================================================= */}
			<Sequence from={0} durationInFrames={105}>
				<AbsoluteFill style={{ opacity: opacity1 }}>
					{/* Video real de fondo */}
					<div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
						<OffthreadVideo
							src={staticFile('videos/pickup_tow.mp4')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								transform: `scale(${interpolate(frame, [0, 105], [1.05, 1.15])})`,
							}}
						/>
						{/* Gradiente cinematográfico */}
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: 'linear-gradient(180deg, rgba(7,9,14,0.85) 0%, rgba(7,9,14,0.3) 40%, rgba(7,9,14,0.85) 100%)',
							}}
						/>
					</div>

					{/* Header Superior */}
					<div
						style={{
							position: 'absolute',
							top: 100,
							left: 0,
							right: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transform: `translateY(${interpolate(spring1, [0, 1], [-40, 0])}px)`,
						}}
					>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 10,
								backgroundColor: 'rgba(239, 68, 68, 0.95)',
								padding: '12px 28px',
								borderRadius: 9999,
								boxShadow: '0 8px 30px rgba(239, 68, 68, 0.5)',
							}}
						>
							<span style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>⚠️ LEY CHILE OBLIGATORIA</span>
						</div>
						<p style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: '#E2E8F0', letterSpacing: 1 }}>
							Decreto Supremo N° 55 MTT
						</p>
					</div>

					{/* Título Principal de Impacto */}
					<div
						style={{
							position: 'absolute',
							bottom: 180,
							left: 60,
							right: 60,
							textAlign: 'center',
							transform: `scale(${spring1})`,
						}}
					>
						<h1
							style={{
								fontSize: 68,
								fontWeight: 900,
								lineHeight: 1.1,
								margin: 0,
								textTransform: 'uppercase',
								textShadow: '0 10px 30px rgba(0,0,0,0.9)',
							}}
						>
							BARRA RÍGIDA <br />
							<span style={{ color: '#EAB308' }}>100% LEGAL</span>
						</h1>
						<p
							style={{
								marginTop: 18,
								fontSize: 32,
								fontWeight: 700,
								color: '#CBD5E1',
								textShadow: '0 4px 15px rgba(0,0,0,0.8)',
							}}
						>
							Prohibido el uso de cuerdas y piolas
						</p>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 2: FOTO REAL DE LA LANZA COMPLETA ARMADA (3.2 - 7.1s)             */}
			{/* ========================================================================= */}
			<Sequence from={95} durationInFrames={120}>
				<AbsoluteFill style={{ opacity: opacity2 }}>
					{/* Foto Real de la Lanza */}
					<div
						style={{
							position: 'absolute',
							top: 140,
							left: 50,
							right: 50,
							height: 850,
							borderRadius: 28,
							overflow: 'hidden',
							boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 0 2px rgba(255,255,255,0.1)',
							transform: `scale(${interpolate(frame, [95, 215], [1.0, 1.06])})`,
						}}
					>
						<Img
							src={staticFile('images/real_lanza_armada.jpeg')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								top: 24,
								left: 24,
								backgroundColor: 'rgba(15, 23, 42, 0.85)',
								padding: '10px 22px',
								borderRadius: 12,
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.15)',
							}}
						>
							<span style={{ fontSize: 22, fontWeight: 800, color: '#38BDF8' }}>📸 FOTO REAL DEL PRODUCTO</span>
						</div>
					</div>

					{/* Especificaciones Técnicas */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 60,
							right: 60,
							display: 'flex',
							flexDirection: 'column',
							gap: 16,
							transform: `translateY(${interpolate(spring2, [0, 1], [40, 0])}px)`,
						}}
					>
						<div
							style={{
								backgroundColor: 'rgba(30, 41, 59, 0.9)',
								padding: '18px 26px',
								borderRadius: 20,
								border: '1px solid rgba(255,255,255,0.12)',
								display: 'flex',
								alignItems: 'center',
								gap: 18,
							}}
						>
							<div style={{ fontSize: 40 }}>🛡️</div>
							<div>
								<div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF' }}>ACERO AL CARBONO MACIZO</div>
								<div style={{ fontSize: 22, color: '#94A3B8' }}>Ojales forjados soldados de máxima penetración</div>
							</div>
						</div>

						<div
							style={{
								backgroundColor: 'rgba(30, 41, 59, 0.9)',
								padding: '18px 26px',
								borderRadius: 20,
								border: '1px solid rgba(255,255,255,0.12)',
								display: 'flex',
								alignItems: 'center',
								gap: 18,
							}}
						>
							<div style={{ fontSize: 40 }}>💪</div>
							<div>
								<div style={{ fontSize: 28, fontWeight: 900, color: '#EAB308' }}>3.500 KG DE CAPACIDAD</div>
								<div style={{ fontSize: 22, color: '#94A3B8' }}>Distancia fija de seguridad: 1.8 metros</div>
							</div>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 3: FOTO REAL DESMONTABLE EN 3 PARTES (6.8 - 10.8s)                */}
			{/* ========================================================================= */}
			<Sequence from={205} durationInFrames={120}>
				<AbsoluteFill style={{ opacity: opacity3 }}>
					{/* Título Superior */}
					<div
						style={{
							position: 'absolute',
							top: 90,
							left: 60,
							right: 60,
							textAlign: 'center',
							transform: `translateY(${interpolate(spring3, [0, 1], [-30, 0])}px)`,
						}}
					>
						<div
							style={{
								display: 'inline-block',
								backgroundColor: '#10B981',
								color: '#064E3B',
								fontWeight: 900,
								fontSize: 22,
								padding: '8px 24px',
								borderRadius: 9999,
								letterSpacing: 1.5,
								marginBottom: 12,
							}}
						>
							DISEÑO PORTÁTIL & INTELIGENTE
						</div>
						<h2 style={{ fontSize: 56, fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
							DESARMABLE EN <span style={{ color: '#38BDF8' }}>3 PIEZAS</span>
						</h2>
					</div>

					{/* Foto Real en 3 Partes */}
					<div
						style={{
							position: 'absolute',
							top: 260,
							left: 50,
							right: 50,
							height: 900,
							borderRadius: 28,
							overflow: 'hidden',
							boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 0 2px rgba(255,255,255,0.1)',
							transform: `scale(${interpolate(frame, [205, 325], [1.0, 1.05])})`,
						}}
					>
						<Img
							src={staticFile('images/real_lanza_3partes.jpeg')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
					</div>

					{/* Badges Inferiores */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 60,
							right: 60,
							display: 'flex',
							justifyContent: 'space-between',
							gap: 16,
						}}
					>
						<div
							style={{
								flex: 1,
								backgroundColor: 'rgba(15, 23, 42, 0.92)',
								padding: '20px 16px',
								borderRadius: 20,
								textAlign: 'center',
								border: '1px solid rgba(56, 189, 248, 0.3)',
							}}
						>
							<div style={{ fontSize: 36, marginBottom: 6 }}>🚗</div>
							<div style={{ fontSize: 24, fontWeight: 800 }}>CABE EN LA MALETERA</div>
						</div>
						<div
							style={{
								flex: 1,
								backgroundColor: 'rgba(15, 23, 42, 0.92)',
								padding: '20px 16px',
								borderRadius: 20,
								textAlign: 'center',
								border: '1px solid rgba(234, 179, 8, 0.3)',
							}}
						>
							<div style={{ fontSize: 36, marginBottom: 6 }}>⏱️</div>
							<div style={{ fontSize: 24, fontWeight: 800 }}>SE ARMA EN 30s</div>
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 4: FOTO REAL DE USO EN VEHÍCULO + ENVÍOS (10.5 - 13.3s)           */}
			{/* ========================================================================= */}
			<Sequence from={315} durationInFrames={85}>
				<AbsoluteFill style={{ opacity: opacity4 }}>
					{/* Foto Arriba: Remolque en Auto Real */}
					<div
						style={{
							position: 'absolute',
							top: 100,
							left: 50,
							right: 50,
							height: 620,
							borderRadius: 24,
							overflow: 'hidden',
							boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
						}}
					>
						<Img
							src={staticFile('images/real_remolque_enganchado.jpeg')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								bottom: 16,
								left: 20,
								backgroundColor: 'rgba(0,0,0,0.8)',
								padding: '8px 18px',
								borderRadius: 10,
								fontSize: 20,
								fontWeight: 800,
								color: '#4ADE80',
							}}
						>
							✅ ENGANCHE REAL Y SEGURO
						</div>
					</div>

					{/* Foto Abajo: Despacho Mercado Libre Real */}
					<div
						style={{
							position: 'absolute',
							bottom: 140,
							left: 50,
							right: 50,
							height: 620,
							borderRadius: 24,
							overflow: 'hidden',
							boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
						}}
					>
						<Img
							src={staticFile('images/real_envio_mercadolibre.jpeg')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								bottom: 16,
								left: 20,
								backgroundColor: 'rgba(0,0,0,0.8)',
								padding: '8px 18px',
								borderRadius: 10,
								fontSize: 20,
								fontWeight: 800,
								color: '#EAB308',
							}}
						>
							📦 DESPACHOS REALES A TODO CHILE
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* ESCENA 5: OFERTA FINAL, LOGO Y CTA DE WHATSAPP (13.0 - 15.0s)            */}
			{/* ========================================================================= */}
			<Sequence from={390} durationInFrames={60}>
				<AbsoluteFill
					style={{
						opacity: opacity5,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 60,
						background: 'radial-gradient(circle at center, #1E293B 0%, #07090E 80%)',
					}}
				>
					{/* Logo de Metal Creativo */}
					<Img
						src={staticFile('images/logo_transparent.png')}
						style={{
							width: 320,
							marginBottom: 30,
							filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.7))',
							transform: `scale(${spring5})`,
						}}
					/>

					{/* Sello de Calidad */}
					<div
						style={{
							backgroundColor: 'rgba(56, 189, 248, 0.15)',
							border: '1px solid #38BDF8',
							color: '#38BDF8',
							padding: '8px 24px',
							borderRadius: 9999,
							fontSize: 22,
							fontWeight: 800,
							letterSpacing: 2,
							marginBottom: 24,
						}}
					>
						🇨🇱 FABRICACIÓN CHILENA EN ACERO
					</div>

					{/* Precio Oficial */}
					<div style={{ textAlign: 'center', marginBottom: 36 }}>
						<div style={{ fontSize: 28, color: '#94A3B8', fontWeight: 700 }}>VALOR OFERTA DIRECTA</div>
						<div style={{ fontSize: 96, fontWeight: 900, color: '#EAB308', lineHeight: 1 }}>
							$65.000 <span style={{ fontSize: 36, color: '#CBD5E1' }}>CLP</span>
						</div>
					</div>

					{/* Botón Pulsante de WhatsApp CTA */}
					<div
						style={{
							backgroundColor: '#22C55E',
							color: '#FFFFFF',
							width: '100%',
							padding: '24px 0',
							borderRadius: 24,
							textAlign: 'center',
							boxShadow: '0 15px 40px rgba(34, 197, 94, 0.4)',
							transform: `scale(${interpolate(frame, [390, 420, 450], [0.95, 1.05, 1.0])})`,
						}}
					>
						<div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 1 }}>
							📲 TOCA AQUÍ Y COTIZA
						</div>
						<div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, opacity: 0.9 }}>
							Respuesta Inmediata por WhatsApp
						</div>
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* BARRA DE PROGRESO INFERIOR DISCRETA                                      */}
			{/* ========================================================================= */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					height: 10,
					width: `${progress}%`,
					backgroundColor: '#EAB308',
					boxShadow: '0 0 15px #EAB308',
				}}
			/>
		</AbsoluteFill>
	);
};
