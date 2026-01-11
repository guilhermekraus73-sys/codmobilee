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

export const codmQuestionsEn: Question[] = [
  {
    id: 1,
    question: "What is the premium currency used to buy items in Call of Duty: Mobile?",
    options: ["Credits", "CP (COD Points)", "Diamonds", "Gold Coins"],
    correctAnswer: 1,
    image: q1CpPoints
  },
  {
    id: 2,
    question: "Which game mode allows up to 100 players on a large map?",
    options: ["Multiplayer", "Zombies", "Battle Royale", "Gunfight"],
    correctAnswer: 2,
    image: q2BattleRoyale
  },
  {
    id: 3,
    question: "What is the name of the iconic skull-masked character in COD Mobile?",
    options: ["Price", "Ghost", "Soap", "Alex Mason"],
    correctAnswer: 1,
    image: q3Ghost
  },
  {
    id: 4,
    question: "How many players make up a team in Search and Destroy mode?",
    options: ["4 players", "5 players", "6 players", "8 players"],
    correctAnswer: 1,
    image: q4SearchDestroy
  },
  {
    id: 5,
    question: "What is the name of the class that allows healing allies in Battle Royale?",
    options: ["Scout", "Medic", "Ninja", "Defender"],
    correctAnswer: 1,
    image: q5Medic
  },
  {
    id: 6,
    question: "Which weapon is known as 'AK-47' in the game?",
    options: ["AK117", "AK-47", "ASM10", "Man-O-War"],
    correctAnswer: 1,
    image: q6Ak47
  },
  {
    id: 7,
    question: "What is the score required to unlock the 'VTOL' Scorestreak?",
    options: ["1200 points", "1400 points", "1600 points", "1800 points"],
    correctAnswer: 2,
    image: q7Vtol
  },
  {
    id: 8,
    question: "In which classic COD map can you play in Multiplayer mode?",
    options: ["Verdansk", "Nuketown", "Erangel", "Pochinki"],
    correctAnswer: 1,
    image: q8Nuketown
  },
  {
    id: 9,
    question: "Which perk allows you to recover faster from tactical grenades?",
    options: ["Persistence", "Ghost", "Toughness", "Lightweight"],
    correctAnswer: 2,
    image: q9Toughness
  },
  {
    id: 10,
    question: "Which company developed Call of Duty: Mobile?",
    options: ["TiMi Studios", "Epic Games", "Supercell", "Riot Games"],
    correctAnswer: 0,
    image: q10Timi
  }
];
