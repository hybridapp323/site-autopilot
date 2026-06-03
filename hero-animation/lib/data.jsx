// Conversation timeline data for the AutoPilot CRM hero animation.
// Times are in seconds (when the item finishes appearing).
// AI / agent messages also carry `typeFrom` — when the typing dots start.

const PHOTOS = [
  'assets/compass-1.jpg',
  'assets/compass-3.jpg',
  'assets/compass-4.jpg',
  'assets/compass-2.jpg',
];

// kind: 'system' | 'in' | 'out' | 'images' | 'note' | 'agent'
const TIMELINE = [
  { id: 'd0',  kind: 'system', at: 0.5,  text: 'quinta-feira' },

  { id: 'm1',  kind: 'in',  at: 1.1,  time: '23:27',
    text: 'Olá, tudo bem? Vi o anúncio do Jeep Compass de vocês' },

  { id: 'm2',  kind: 'out', ai: true, typeFrom: 1.9, at: 2.8, time: '23:28',
    text: 'Olá! Tudo ótimo 😊 Aqui é a Sofia, assistente da RZ Premium. Pra te atender certinho, qual seu nome e de qual cidade você fala?' },

  { id: 'm3',  kind: 'in',  at: 4.1,  time: '23:29',
    text: 'Sou o Carlos Henrique, de São Paulo' },

  { id: 'm4',  kind: 'out', ai: true, typeFrom: 4.7, at: 5.6, time: '23:30',
    text: 'Prazer, Carlos! Sobre o Compass, temos duas opções disponíveis: 1) Compass Longitude 1.3 T270 23/23 por R$ 125.000  2) Compass Limited 2.0 19/20 por R$ 103.900. Qual te interessa mais?' },

  { id: 'm5',  kind: 'in',  at: 7.2,  time: '23:31',
    text: 'Gostei do Longitude 23/23. Pode me mandar fotos?' },

  { id: 'm6',  kind: 'out', ai: true, typeFrom: 7.8, at: 8.5, time: '23:32',
    text: 'Claro! Olha só esse Compass Longitude 1.3 T270 23/23 👇' },

  { id: 'm7',  kind: 'images', at: 9.1, time: '23:32', photos: PHOTOS,
    caption: 'Compass Longitude 1.3 T270 23/23' },

  { id: 'm8',  kind: 'out', ai: true, at: 11.3, time: '23:32',
    text: 'É um SUV impecável, único dono, revisões em concessionária. Carlos, como você pretende fazer o pagamento: à vista, financiamento ou consórcio?' },

  { id: 'm9',  kind: 'in',  at: 12.8, time: '23:33',
    text: 'Vou dar uma entrada boa, uns 80 mil, e financiar o resto' },

  { id: 'm10', kind: 'out', ai: true, typeFrom: 13.4, at: 14.1, time: '23:34',
    text: 'Ótimo! Tem algum carro pra dar na troca?' },

  { id: 'm11', kind: 'in',  at: 15.1, time: '23:34',
    text: 'Não, só a entrada mesmo' },

  { id: 'm12', kind: 'out', ai: true, typeFrom: 15.7, at: 16.5, time: '23:35',
    text: 'Perfeito. Pra você sentir o carro de verdade, que tal agendarmos uma visita? Tenho horários no sábado de manhã ou tarde, o que prefere?' },

  { id: 'm13', kind: 'in',  at: 18.0, time: '23:36',
    text: 'Sábado de manhã fica bom pra mim' },

  { id: 'm14', kind: 'out', ai: true, typeFrom: 18.6, at: 19.4, time: '23:37',
    text: 'Show! Vou te transferir agora pro Marcos, nosso consultor, que vai confirmar o horário e te dar todos os detalhes do financiamento. Ele já te chama por aqui 🤝' },

  { id: 'm15', kind: 'note', ai: true, at: 20.7, time: '23:37' },

  { id: 'm16', kind: 'agent', at: 22.8, time: '23:51', agent: 'Marcos',
    text: 'Opa, Carlos! Aqui é o Marcos da RZ Premium. Vou dar continuidade no seu atendimento, já te ligo aí pra confirmar a visita de sábado 🤝' },
];

const DURATION = 26.5;

// Lead-panel field reveal schedule — each fills in as the AI learns it.
const LEAD_FIELDS = [
  { id: 'nome',   label: 'Nome',        value: 'Carlos Henrique',                  at: 4.1 },
  { id: 'cidade', label: 'Cidade',      value: 'São Paulo / SP',                   at: 4.1 },
  { id: 'inter',  label: 'Interesse',   value: 'Compass Longitude 1.3 T270 23/23', at: 7.2 },
  { id: 'pag',    label: 'Pagamento',   value: 'Entrada R$ 80.000 + financiar',    at: 12.8 },
  { id: 'troca',  label: 'Troca',       value: 'Sem veículo na troca',             at: 15.1 },
  { id: 'visita', label: 'Visita',      value: 'Sábado de manhã',                  at: 18.0 },
];

// Temperature steps + AI score ramp keyed to time.
const TEMP_STEPS = [
  { at: 0,    emoji: '❄️', label: 'Frio',  color: 'var(--info)' },
  { at: 7.2,  emoji: '🌡️', label: 'Morno', color: 'var(--warning)' },
  { at: 18.0, emoji: '🔥', label: 'Quente', color: 'var(--destructive)' },
];

window.HERO_DATA = { TIMELINE, DURATION, LEAD_FIELDS, TEMP_STEPS, PHOTOS };
