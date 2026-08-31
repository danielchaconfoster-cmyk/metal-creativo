import React from 'react';
import { Composition } from 'remotion';
import { LanzaLegal15s } from './Compositions/LanzaLegal15s';
import { AnuncioPickupTow } from './Compositions/AnuncioPickupTow';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="LanzaLegal15s"
				component={LanzaLegal15s}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="AnuncioPickupTow"
				component={AnuncioPickupTow}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
