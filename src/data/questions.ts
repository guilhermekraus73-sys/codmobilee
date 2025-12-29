export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const codmQuestions: Question[] = [
  {
    id: 1,
    question: "¿Cuál es la moneda premium utilizada para comprar artículos en Call of Duty: Mobile?",
    options: ["Créditos", "CP (COD Points)", "Diamantes", "Monedas de Oro"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "¿Qué modo de juego permite hasta 100 jugadores en un mapa grande?",
    options: ["Multijugador", "Zombies", "Battle Royale", "Tiroteo"],
    correctAnswer: 2
  },
  {
    id: 3,
    question: "¿Cuál es el nombre del personaje icónico con máscara de calavera en COD Mobile?",
    options: ["Price", "Ghost", "Soap", "Alex Mason"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "¿Cuántos jugadores componen un equipo en el modo Buscar y Destruir?",
    options: ["4 jugadores", "5 jugadores", "6 jugadores", "8 jugadores"],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "¿Cuál es el nombre de la clase que permite curar aliados en Battle Royale?",
    options: ["Scout", "Médico", "Ninja", "Defensor"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "¿Qué arma es conocida como 'AK-47' en el juego?",
    options: ["AK117", "AK-47", "ASM10", "Man-O-War"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "¿Cuál es la puntuación necesaria para desbloquear la Scorestreak 'VTOL'?",
    options: ["1200 puntos", "1400 puntos", "1600 puntos", "1800 puntos"],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "¿En qué mapa clásico de COD puedes jugar en el modo Multijugador?",
    options: ["Verdansk", "Nuketown", "Erangel", "Pochinki"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "¿Qué ventaja te permite recuperarte más rápido de granadas tácticas?",
    options: ["Persistencia", "Fantasma", "Determinado", "Ligero"],
    correctAnswer: 2
  },
  {
    id: 10,
    question: "¿Qué empresa desarrolló Call of Duty: Mobile?",
    options: ["TiMi Studios", "Epic Games", "Supercell", "Riot Games"],
    correctAnswer: 0
  }
];
