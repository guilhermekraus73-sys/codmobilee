export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const codmQuestions: Question[] = [
  {
    id: 1,
    question: "Qual é a moeda premium usada para comprar itens no Call of Duty: Mobile?",
    options: ["Créditos", "CP (COD Points)", "Diamantes", "Moedas de Ouro"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Qual modo de jogo permite até 100 jogadores em um grande mapa?",
    options: ["Multijogador", "Zombies", "Battle Royale", "Tiroteio"],
    correctAnswer: 2
  },
  {
    id: 3,
    question: "Qual é o nome do personagem icônico com máscara de caveira em COD Mobile?",
    options: ["Price", "Ghost", "Soap", "Alex Mason"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "Quantos jogadores compõem uma equipe no modo Buscar e Destruir?",
    options: ["4 jogadores", "5 jogadores", "6 jogadores", "8 jogadores"],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "Qual é o nome da classe que permite curar aliados no Battle Royale?",
    options: ["Scout", "Medic", "Ninja", "Defender"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "Qual arma é conhecida como 'AK-47' no jogo?",
    options: ["AK117", "AK-47", "ASM10", "Man-O-War"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "Qual é a pontuação necessária para desbloquear a Scorestreak 'VTOL'?",
    options: ["1200 pontos", "1400 pontos", "1600 pontos", "1800 pontos"],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "Em qual mapa clássico de COD você pode jogar no modo Multijogador?",
    options: ["Verdansk", "Nuketown", "Erangel", "Pochinki"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "Qual vantagem permite que você se recupere mais rápido de granadas táticas?",
    options: ["Persistência", "Fantasma", "Determinado", "Ligeiro"],
    correctAnswer: 2
  },
  {
    id: 10,
    question: "Qual empresa desenvolveu Call of Duty: Mobile?",
    options: ["TiMi Studios", "Epic Games", "Supercell", "Riot Games"],
    correctAnswer: 0
  }
];
