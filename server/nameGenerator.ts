// Gerador de nomes aleatórios para usuários
const adjectives = [
  "Veloz", "Sombrio", "Brilhante", "Místico", "Feroz", "Sereno", "Audaz", "Élfico",
  "Lunar", "Solar", "Etéreo", "Flamejante", "Gélido", "Tempestuoso", "Radiante", "Noturno",
  "Dourado", "Prateado", "Cristalino", "Sábio", "Corajoso", "Astuto", "Forte", "Ágil",
  "Mágico", "Divino", "Ancestral", "Lendário", "Épico", "Supremo", "Imperial", "Real",
  "Vitorioso", "Invencível", "Heroico", "Nobre", "Puro", "Selvagem", "Livre", "Eterno"
];

const nouns = [
  "Dragão", "Fênix", "Lobo", "Falcão", "Tigre", "Leão", "Águia", "Serpente",
  "Samurai", "Ninja", "Guerreiro", "Mago", "Arqueiro", "Cavaleiro", "Guardião", "Protetor",
  "Caçador", "Explorador", "Aventureiro", "Viajante", "Andarilho", "Errante", "Nômade", "Peregrino",
  "Lâmina", "Espada", "Escudo", "Punho", "Garra", "Chama", "Raio", "Trovão",
  "Vento", "Terra", "Água", "Fogo", "Luz", "Sombra", "Estrela", "Lua",
  "Sol", "Cosmos", "Infinito", "Destino", "Sonho", "Espírito", "Alma", "Coração"
];

export function generateRandomDisplayName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

export function canChangeDisplayName(lastChangeDate: Date): boolean {
  const now = new Date();
  const daysSinceLastChange = Math.floor(
    (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceLastChange >= 7;
}

export function getDaysUntilNextChange(lastChangeDate: Date): number {
  const now = new Date();
  const daysSinceLastChange = Math.floor(
    (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(0, 7 - daysSinceLastChange);
}