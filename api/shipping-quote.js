// Vercel Serverless Function: api/shipping-quote.js
// Cotizador Inteligente y Determinista de Fletes para Chile (Starken / Chilexpress / Starken Por Pagar)

const REGIONAL_RATES = {
  'Arica y Parinacota': { code: 'XV', zone: 'norte_extremo', baseStarken: 14500, days: '3 a 5 días hábiles' },
  'Tarapacá': { code: 'I', zone: 'norte_extremo', baseStarken: 13900, days: '3 a 5 días hábiles' },
  'Antofagasta': { code: 'II', zone: 'norte_grande', baseStarken: 11900, days: '2 a 4 días hábiles' },
  'Atacama': { code: 'III', zone: 'norte_chico', baseStarken: 9800, days: '2 a 3 días hábiles' },
  'Coquimbo': { code: 'IV', zone: 'centro_norte', baseStarken: 7200, days: '1 a 2 días hábiles' },
  'Valparaíso': { code: 'V', zone: 'local_origen', baseStarken: 4500, days: '24 a 48 hrs' },
  'Región Metropolitana': { code: 'RM', zone: 'rm', baseStarken: 4990, days: '24 a 48 hrs' },
  "O'Higgins": { code: 'VI', zone: 'centro_sur', baseStarken: 6800, days: '24 a 48 hrs' },
  'Maule': { code: 'VII', zone: 'centro_sur', baseStarken: 7200, days: '1 a 2 días hábiles' },
  'Ñuble': { code: 'XVI', zone: 'centro_sur', baseStarken: 7800, days: '2 a 3 días hábiles' },
  'Biobío': { code: 'VIII', zone: 'sur_cercano', baseStarken: 7900, days: '2 a 3 días hábiles' },
  'La Araucanía': { code: 'IX', zone: 'sur_cercano', baseStarken: 8500, days: '2 a 4 días hábiles' },
  'Los Ríos': { code: 'XIV', zone: 'sur_medio', baseStarken: 8900, days: '2 a 4 días hábiles' },
  'Los Lagos': { code: 'X', zone: 'sur_medio', baseStarken: 9500, days: '3 a 5 días hábiles' },
  'Aysén': { code: 'XI', zone: 'austral_extremo', baseStarken: 16900, days: '5 a 8 días hábiles' },
  'Magallanes': { code: 'XII', zone: 'austral_extremo', baseStarken: 18900, days: '5 a 8 días hábiles' }
};

// Aliases y mapeo inteligente de comunas
const COMMUNE_MAP = {
  'santiago': 'Región Metropolitana',
  'providencia': 'Región Metropolitana',
  'las condes': 'Región Metropolitana',
  'la florida': 'Región Metropolitana',
  'maipu': 'Región Metropolitana',
  'maipú': 'Región Metropolitana',
  'puente alto': 'Región Metropolitana',
  'nunoa': 'Región Metropolitana',
  'ñuñoa': 'Región Metropolitana',
  'san bernardo': 'Región Metropolitana',
  'quilicura': 'Región Metropolitana',
  'colina': 'Región Metropolitana',
  'quillota': 'Valparaíso',
  'vina del mar': 'Valparaíso',
  'viña del mar': 'Valparaíso',
  'valparaiso': 'Valparaíso',
  'valparaíso': 'Valparaíso',
  'quilpue': 'Valparaíso',
  'quilpué': 'Valparaíso',
  'villa alemana': 'Valparaíso',
  'la calera': 'Valparaíso',
  'san antonio': 'Valparaíso',
  'los andes': 'Valparaíso',
  'san felipe': 'Valparaíso',
  'rancagua': "O'Higgins",
  'machali': "O'Higgins",
  'san fernando': "O'Higgins",
  'talca': 'Maule',
  'curico': 'Maule',
  'curicó': 'Maule',
  'linares': 'Maule',
  'chillan': 'Ñuble',
  'chillán': 'Ñuble',
  'concepcion': 'Biobío',
  'concepción': 'Biobío',
  'talcahuano': 'Biobío',
  'los angeles': 'Biobío',
  'los ángeles': 'Biobío',
  'san pedro de la paz': 'Biobío',
  'temuco': 'La Araucanía',
  'padre las casas': 'La Araucanía',
  'villarrica': 'La Araucanía',
  'pucon': 'La Araucanía',
  'pucón': 'La Araucanía',
  'valdivia': 'Los Ríos',
  'la union': 'Los Ríos',
  'puerto montt': 'Los Lagos',
  'puerto varas': 'Los Lagos',
  'osorno': 'Los Lagos',
  'castro': 'Los Lagos',
  'ancud': 'Los Lagos',
  'la serena': 'Coquimbo',
  'coquimbo': 'Coquimbo',
  'ovalle': 'Coquimbo',
  'copiapo': 'Atacama',
  'copiapó': 'Atacama',
  'vallenar': 'Atacama',
  'antofagasta': 'Antofagasta',
  'calama': 'Antofagasta',
  'tocopilla': 'Antofagasta',
  'iquique': 'Tarapacá',
  'alto hospicio': 'Tarapacá',
  'arica': 'Arica y Parinacota',
  'coyhaique': 'Aysén',
  'coihaique': 'Aysén',
  'puerto aysen': 'Aysén',
  'punta arenas': 'Magallanes',
  'puerto natales': 'Magallanes'
};

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calculateShipping(communeOrRegion, productId = 'barra_remolque') {
  const norm = normalizeString(communeOrRegion);
  let matchedRegion = null;

  // 1. Buscar en comunas directas
  if (COMMUNE_MAP[norm]) {
    matchedRegion = COMMUNE_MAP[norm];
  } else {
    // 2. Buscar por nombre de región
    for (const [regionName, info] of Object.entries(REGIONAL_RATES)) {
      if (normalizeString(regionName) === norm || normalizeString(info.code) === norm) {
        matchedRegion = regionName;
        break;
      }
    }
  }

  // Si no se encuentra, por defecto asignamos RM/Zona Centro
  if (!matchedRegion) {
    matchedRegion = 'Región Metropolitana';
  }

  const rateInfo = REGIONAL_RATES[matchedRegion];
  const isFogone = productId === 'fogon';
  
  // Multiplicador por peso / volumen (Barra = 6kg, Fogón = 12kg)
  const weightMultiplier = isFogone ? 1.6 : 1.0;
  const estimatedStarken = Math.round((rateInfo.baseStarken * weightMultiplier) / 100) * 100;
  const estimatedChilexpress = Math.round(estimatedStarken * 1.18 / 100) * 100;

  return {
    success: true,
    input: communeOrRegion,
    region: matchedRegion,
    estimatedDays: rateInfo.days,
    couriers: {
      starken: {
        name: 'Starken (Sucursal o Domicilio)',
        cost: estimatedStarken,
        modality: matchedRegion === 'Región Metropolitana' ? 'pagado' : 'por_pagar',
        recommended: true
      },
      chilexpress: {
        name: 'Chilexpress Prioritario',
        cost: estimatedChilexpress,
        modality: 'por_pagar',
        recommended: false
      }
    },
    message: `Envío estimado para ${matchedRegion}: $${estimatedStarken.toLocaleString('es-CL')} CLP vía Starken (${rateInfo.days}). Modalidad habitual: Por Pagar a sucursal o domicilio.`
  };
}

module.exports = async (req, res) => {
  // Soporta tanto GET ?commune=Temuco como POST { commune: 'Temuco' }
  const query = req.query || {};
  const body = req.body || {};
  const input = query.commune || query.region || body.commune || body.region || 'Región Metropolitana';
  const productId = query.product || body.product || 'barra_remolque';

  const result = calculateShipping(input, productId);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(result);
};

module.exports.calculateShipping = calculateShipping;
module.exports.COMMUNE_MAP = COMMUNE_MAP;
module.exports.REGIONAL_RATES = REGIONAL_RATES;
