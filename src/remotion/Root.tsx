import React from 'react';
import { Composition } from 'remotion';
import { LanzaEditorialLargeColor } from './Compositions/LanzaEditorialLargeColor';
import { LanzaEditorialClean } from './Compositions/LanzaEditorialClean';
import { LanzaLegalMasterpiece } from './Compositions/LanzaLegalMasterpiece';
import { LanzaLottiePro } from './Compositions/LanzaLottiePro';
import { LanzaLegal15s } from './Compositions/LanzaLegal15s';
import { AnuncioPickupTow } from './Compositions/AnuncioPickupTow';
import { LanzaRealShowcase } from './Compositions/LanzaRealShowcase';
import { LanzaRealPuro } from './Compositions/LanzaRealPuro';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="LanzaRealPuro"
				component={LanzaRealPuro}
				durationInFrames={570}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="LanzaRealShowcase"
				component={LanzaRealShowcase}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="LanzaEditorialLargeColor"
				component={LanzaEditorialLargeColor}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="LanzaEditorialClean"
				component={LanzaEditorialClean}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="LanzaLegalMasterpiece"
				component={LanzaLegalMasterpiece}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="LanzaLottiePro"
				component={LanzaLottiePro}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
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
