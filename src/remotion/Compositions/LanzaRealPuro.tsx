import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
} from 'remotion';

export const LanzaRealPuro: React.FC = () => {
	const frame = useCurrentFrame();

	// Transiciones suaves entre tomas (sin ningún texto ni animación superpuesta)
	// Clip 1: 0 - 120 (0.0s - 4.0s) -> Video Real en Carretera
	const opacity1 = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Clip 2: 110 - 210 (3.6s - 7.0s) -> Foto Real del Kia con la Lanza Instalada (foro real 2)
	const opacity2 = interpolate(frame, [110, 125, 195, 210], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Clip 3: 200 - 300 (6.6s - 10.0s) -> Foto Real Lanza Armada Completa
	const opacity3 = interpolate(frame, [200, 215, 285, 300], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Clip 4: 290 - 390 (9.6s - 13.0s) -> Foto Real Desarmada en 3 Partes con Pasadores
	const opacity4 = interpolate(frame, [290, 305, 375, 390], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Clip 5: 380 - 480 (12.6s - 16.0s) -> Foto Real Remolque Enganchado en Calle
	const opacity5 = interpolate(frame, [380, 395, 465, 480], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Clip 6: 470 - 570 (15.6s - 19.0s) -> Foto Real Paquete Despachado Mercado Libre
	const opacity6 = interpolate(frame, [470, 485], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
			{/* Audio de fondo limpio */}
			<Audio src={staticFile('audio/musica_fondo.wav')} volume={0.8} />

			{/* ========================================================================= */}
			{/* CLIP 1: VIDEO REAL DE REMOLQUE EN MOVIMIENTO (0 - 4s)                     */}
			{/* ========================================================================= */}
			<Sequence from={0} durationInFrames={120}>
				<AbsoluteFill style={{ opacity: opacity1, backgroundColor: '#000000' }}>
					<OffthreadVideo
						src={staticFile('videos/pickup_tow.mp4')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* CLIP 2: FOTO REAL DEL KIA CON LA BARRA INSTALADA (3.6s - 7.0s)           */}
			{/* ========================================================================= */}
			<Sequence from={110} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity2, backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/foro_real_2.jpeg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* CLIP 3: FOTO REAL DE LA LANZA ARMADA EN ACERO MACIZO (6.6s - 10.0s)      */}
			{/* ========================================================================= */}
			<Sequence from={200} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity3, backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/real_lanza_armada.jpeg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							backgroundColor: '#0A0D14',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* CLIP 4: FOTO REAL DESMONTABLE EN 3 PIEZAS CON PASADORES (9.6s - 13.0s)   */}
			{/* ========================================================================= */}
			<Sequence from={290} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity4, backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/real_lanza_3partes.jpeg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							backgroundColor: '#0A0D14',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* CLIP 5: FOTO REAL REMOLQUE ENGANCHADO ENTRE AUTOS (12.6s - 16.0s)        */}
			{/* ========================================================================= */}
			<Sequence from={380} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity5, backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/real_remolque_enganchado.jpeg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							backgroundColor: '#0A0D14',
						}}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* ========================================================================= */}
			{/* CLIP 6: FOTO REAL DESPACHO MERCADO LIBRE / EMBALAJE (15.6s - 19.0s)      */}
			{/* ========================================================================= */}
			<Sequence from={470} durationInFrames={100}>
				<AbsoluteFill style={{ opacity: opacity6, backgroundColor: '#000000' }}>
					<Img
						src={staticFile('images/real_envio_mercadolibre.jpeg')}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							backgroundColor: '#0A0D14',
						}}
					/>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};
