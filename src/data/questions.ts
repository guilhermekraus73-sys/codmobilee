import q1CpPoints from '@/assets/quiz/q1-cp-points.jpg';
import q2BattleRoyale from '@/assets/quiz/q2-battle-royale.jpg';
import q3Ghost from '@/assets/quiz/q3-ghost.jpg';
import q4SearchDestroy from '@/assets/quiz/q4-search-destroy.jpg';
import q5Medic from '@/assets/quiz/q5-medic.jpg';
import q6Ak47 from '@/assets/quiz/q6-ak47.jpg';
import q7Vtol from '@/assets/quiz/q7-vtol.jpg';
import q8Nuketown from '@/assets/quiz/q8-nuketown.jpg';
import q9Toughness from '@/assets/quiz/q9-toughness.jpg';
import q10Timi from '@/assets/quiz/q10-timi.jpg';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  image: string;
}

export const codmQuestions: Question[] = [
  {
    id: 1,
    question: "¿Cuál es la moneda premium utilizada para comprar artículos en Call of Duty: Mobile?",
    options: ["Créditos", "CP (COD Points)", "Diamantes", "Monedas de Oro"],
    correctAnswer: 1,
    image: q1CpPoints
  },
  {
    id: 2,
    question: "¿Qué modo de juego permite hasta 100 jugadores en un mapa grande?",
    options: ["Multijugador", "Zombies", "Battle Royale", "Tiroteo"],
    correctAnswer: 2,
    image: q2BattleRoyale
  },
  {
    id: 3,
    question: "¿Cuál es el nombre del personaje icónico con máscara de calavera en COD Mobile?",
    options: ["Price", "Ghost", "Soap", "Alex Mason"],
    correctAnswer: 1,
    image: q3Ghost
  },
  {
    id: 4,
    question: "¿Cuántos jugadores componen un equipo en el modo Buscar y Destruir?",
    options: ["4 jugadores", "5 jugadores", "6 jugadores", "8 jugadores"],
    correctAnswer: 1,
    image: q4SearchDestroy
  },
  {
    id: 5,
    question: "¿Cuál es el nombre de la clase que permite curar aliados en Battle Royale?",
    options: ["Scout", "Médico", "Ninja", "Defensor"],
    correctAnswer: 1,
    image: q5Medic
  },
  {
    id: 6,
    question: "¿Qué arma es conocida como 'AK-47' en el juego?",
    options: ["AK117", "AK-47", "ASM10", "Man-O-War"],
    correctAnswer: 1,
    image: q6Ak47
  },
  {
    id: 7,
    question: "¿Cuál es la puntuación necesaria para desbloquear la Scorestreak 'VTOL'?",
    options: ["1200 puntos", "1400 puntos", "1600 puntos", "1800 puntos"],
    correctAnswer: 2,
    image: q7Vtol
  },
  {
    id: 8,
    question: "¿En qué mapa clásico de COD puedes jugar en el modo Multijugador?",
    options: ["Verdansk", "Nuketown", "Erangel", "Pochinki"],
    correctAnswer: 1,
    image: q8Nuketown
  },
  {
    id: 9,
    question: "¿Qué ventaja te permite recuperarte más rápido de granadas tácticas?",
    options: ["Persistencia", "Fantasma", "Determinado", "Ligero"],
    correctAnswer: 2,
    image: q9Toughness
  },
  {
    id: 10,
    question: "¿Qué empresa desarrolló Call of Duty: Mobile?",
    options: ["TiMi Studios", "Epic Games", "Supercell", "Riot Games"],
    correctAnswer: 0,
    image: q10Timi
  }
];
