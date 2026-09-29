import { ServiceType, User, Client, Appointment } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_master_1',
    name: 'Gestor Master CAST',
    email: 'ale11062@gmail.com',
    role: 'master',
    status: 'active',
    password: 'cast@2468',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'user_tech_1',
    name: 'Carlos Oliveira',
    email: 'carlos@cast.com.br',
    role: 'technician',
    status: 'active',
    password: '123',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'user_tech_2',
    name: 'Fernando Rocha',
    email: 'fernando@cast.com.br',
    role: 'technician',
    status: 'active',
    password: '123',
    createdAt: '2026-02-10T10:00:00.000Z',
  }
];

export const INITIAL_SERVICES: ServiceType[] = [
  {
    id: 'srv_1',
    name: 'Instalação de câmeras',
    description: 'Instalação e alinhamento de câmeras de segurança IP ou analógicas',
    tools: [
      'Furadeira',
      'Parafusadeira',
      'Escada',
      'Multímetro',
      'Alicate de corte',
      'Alicate de crimpar',
      'Passa-fio',
      'Chave de fenda',
      'Chave Philips',
      'Conectores BNC/P4'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_2',
    name: 'Manutenção de CFTV',
    description: 'Diagnóstico e reparo de gravadores DVR/NVR e câmeras com falha',
    tools: [
      'Multímetro',
      'Testador de cabo de rede',
      'Monitor de teste CFTV',
      'Alicate de corte',
      'Chaves Philips/fenda',
      'Fita isolante'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_3',
    name: 'Instalação elétrica',
    description: 'Instalação de tomadas, disjuntores, luminárias e quadros',
    tools: [
      'Alicate decapador',
      'Alicate universal',
      'Passa-fio',
      'Fita isolante',
      'Multímetro',
      'Chave teste de tensão',
      'Escada'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_4',
    name: 'Manutenção elétrica',
    description: 'Localização de curto-circuito, fuga de corrente e substituição preventiva',
    tools: [
      'Multímetro',
      'Alicate amperímetro',
      'Chave de fenda isolada 1000V',
      'Detector de tensão sonoro',
      'Luvas isolantes',
      'Lanterna'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_5',
    name: 'Instalação de rede',
    description: 'Cabeamento estruturado Cat6, pontos de rede e patch panels',
    tools: [
      'Alicate de crimpar RJ45',
      'Testador de cabo de rede',
      'Passa-fio',
      'Ferramenta de inserção Punch Down',
      'Alicate de corte',
      'Patch cords de teste'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_6',
    name: 'Instalação de fechadura eletrônica',
    description: 'Furação e instalação de fechaduras digitais, biométricas e smart',
    tools: [
      'Furadeira',
      'Brocas serra-copo para madeira/metal',
      'Formão para entalhe',
      'Trena métrica',
      'Parafusadeira',
      'Nível de bolha',
      'Chaves Philips'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_7',
    name: 'Instalação de controle de acesso',
    description: 'Instalação de leitor de tag RFID, botoeiras e eletroímãs',
    tools: [
      'Multímetro',
      'Furadeira',
      'Passa-fio',
      'Fonte de alimentação 12V',
      'Chaves de precisão',
      'Conectores e fita isolante'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_8',
    name: 'Instalação de cerca elétrica',
    description: 'Fixação de hastes de cerca, isoladores, central de choque e aterramento',
    tools: [
      'Escada extensível',
      'Alicate de corte e dobra',
      'Alicate de pressão',
      'Esticador de arame',
      'Isoladores plásticos',
      'Chaves de boca',
      'Voltímetro de alta tensão para cerca'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_9',
    name: 'Manutenção hidráulica',
    description: 'Substituição de conexões, reparo de vazamentos e registros técnicos',
    tools: [
      'Chave inglesa',
      'Chave de grifo',
      'Fita veda-rosca',
      'Alicate bomba d água',
      'Serra para tubos PVC'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv_10',
    name: 'Montagem de móveis',
    description: 'Montagem de bancadas técnicas, racks para TI e suportes',
    tools: [
      'Parafusadeira',
      'Chave Allen jogo completo',
      'Martelo de borracha',
      'Nível de bolha',
      'Trena',
      'Ponteiras magnéticas'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'João da Silva',
    address: 'Rua das Palmeiras, 450 - Jardim Satélite',
    phone: '(11) 98765-4321',
    notes: 'Portão azul, interfone 12.',
    createdAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: 'cli_2',
    name: 'Maria Oliveira',
    address: 'Av. Paulista, 1200, Conj 45 - Centro',
    phone: '(11) 99123-4567',
    notes: 'Acesso pela portaria de serviço com crachá.',
    createdAt: '2026-01-22T00:00:00.000Z',
  },
  {
    id: 'cli_3',
    name: 'Roberto Santos',
    address: 'Rua General Osório, 89 - Vila Industrial',
    phone: '(11) 97654-3210',
    notes: 'Galpão comercial.',
    createdAt: '2026-02-05T00:00:00.000Z',
  },
  {
    id: 'cli_4',
    name: 'Ana Carolina Pereira',
    address: 'Rua Bela Cintra, 620 - Consolação',
    phone: '(11) 98111-2233',
    notes: 'Condomínio fechado, avisar na guarita.',
    createdAt: '2026-02-15T00:00:00.000Z',
  }
];

// Helper to get formatted dates relative to today
const getLocalDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getInitialAppointments = (): Appointment[] => {
  const today = getLocalDateString(0);
  const tomorrow = getLocalDateString(1);
  const inTwoDays = getLocalDateString(2);

  return [
    {
      id: 'apt_1',
      clientName: 'João da Silva',
      clientAddress: 'Rua das Palmeiras, 450 - Jardim Satélite',
      clientPhone: '(11) 98765-4321',
      serviceTypeId: 'srv_1',
      serviceTypeName: 'Instalação de câmeras',
      date: today,
      time: '08:00',
      status: 'scheduled',
      notes: 'Instalação de 4 câmeras na área externa do sobrado.',
      tools: [
        'Furadeira',
        'Parafusadeira',
        'Escada',
        'Multímetro',
        'Alicate de corte',
        'Alicate de crimpar',
        'Passa-fio',
        'Chave de fenda',
        'Chave Philips',
        'Conectores BNC/P4'
      ],
      toolChecklist: {
        'Furadeira': true,
        'Parafusadeira': true,
        'Escada': false,
        'Multímetro': true,
        'Alicate de corte': true,
        'Alicate de crimpar': false,
        'Passa-fio': false,
        'Chave de fenda': true,
        'Chave Philips': true,
        'Conectores BNC/P4': true
      },
      reminderMinutes: 30,
      createdBy: 'user_master_1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt_2',
      clientName: 'Maria Oliveira',
      clientAddress: 'Av. Paulista, 1200, Conj 45 - Centro',
      clientPhone: '(11) 99123-4567',
      serviceTypeId: 'srv_4',
      serviceTypeName: 'Manutenção elétrica',
      date: today,
      time: '14:00',
      status: 'in_progress',
      notes: 'Disjuntor principal caindo quando liga o ar condicionado.',
      tools: [
        'Multímetro',
        'Alicate amperímetro',
        'Chave de fenda isolada 1000V',
        'Detector de tensão sonoro',
        'Luvas isolantes',
        'Lanterna'
      ],
      toolChecklist: {
        'Multímetro': true,
        'Alicate amperímetro': true,
        'Chave de fenda isolada 1000V': true,
        'Detector de tensão sonoro': true,
        'Luvas isolantes': true,
        'Lanterna': true
      },
      reminderMinutes: 15,
      createdBy: 'user_master_1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt_3',
      clientName: 'Roberto Santos',
      clientAddress: 'Rua General Osório, 89 - Vila Industrial',
      clientPhone: '(11) 97654-3210',
      serviceTypeId: 'srv_5',
      serviceTypeName: 'Instalação de rede',
      date: tomorrow,
      time: '09:30',
      status: 'scheduled',
      notes: 'Passagem de 6 pontos de rede Cat6 no escritório novo.',
      tools: [
        'Alicate de crimpar RJ45',
        'Testador de cabo de rede',
        'Passa-fio',
        'Ferramenta de inserção Punch Down',
        'Alicate de corte',
        'Patch cords de teste'
      ],
      toolChecklist: {},
      reminderMinutes: 60,
      createdBy: 'user_master_1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt_4',
      clientName: 'Ana Carolina Pereira',
      clientAddress: 'Rua Bela Cintra, 620 - Consolação',
      clientPhone: '(11) 98111-2233',
      serviceTypeId: 'srv_6',
      serviceTypeName: 'Instalação de fechadura eletrônica',
      date: inTwoDays,
      time: '11:00',
      status: 'scheduled',
      notes: 'Porta de madeira pivotante.',
      tools: [
        'Furadeira',
        'Brocas serra-copo para madeira/metal',
        'Formão para entalhe',
        'Trena métrica',
        'Parafusadeira',
        'Nível de bolha',
        'Chaves Philips'
      ],
      toolChecklist: {},
      reminderMinutes: 30,
      createdBy: 'user_master_1',
      createdAt: new Date().toISOString(),
    }
  ];
};
