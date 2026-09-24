// =====================================================================
//  DUNGEON BREAK — js/entities/MemoryEcho.js
//  Entity representation for story memory echo fragments
// =====================================================================

export class MemoryEcho {
  constructor(floor, title, quote, lore, choiceA, choiceB) {
    this.floor = floor;
    this.title = title;
    this.quote = quote;
    this.lore = lore;
    this.choiceA = choiceA;
    this.choiceB = choiceB;
  }
}
