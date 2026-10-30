import { Monster } from '../types/rpg';

/**
 * Parses raw XML string into strongly typed Monster definitions using the browser's DOMParser.
 */
export function parseBestiaryXML(xmlText: string): Monster[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML Parse Failure: ' + parserError.textContent);
  }

  const monsters: Monster[] = [];
  const monsterNodes = xmlDoc.getElementsByTagName('monster');

  for (let i = 0; i < monsterNodes.length; i++) {
    const node = monsterNodes[i];
    const getTag = (tag: string, fallback: string = ''): string => {
      const el = node.getElementsByTagName(tag)[0];
      return el && el.textContent ? el.textContent.trim() : fallback;
    };

    const maxHp = parseInt(getTag('maxHp', '50'), 10);
    const atk = parseInt(getTag('attackPower', '12'), 10);
    const gold = parseInt(getTag('goldReward', '20'), 10);
    const expReward = parseInt(getTag('expReward', '30'), 10);

    const specialAbility =
      getTag('specialAbility') ||
      getTag('ability') ||
      (getTag('specialMove').toLowerCase().includes('poison') || getTag('element').toLowerCase().includes('poison')
        ? 'poison'
        : getTag('specialMove').toLowerCase().includes('shield') || getTag('specialMove').toLowerCase().includes('shell') || getTag('specialMove').toLowerCase().includes('aegis')
        ? 'defensive_stance'
        : 'none');

    monsters.push({
      id: node.getAttribute('id') || `mob_${i}`,
      name: getTag('name', 'Unknown Fiend'),
      maxHp: isNaN(maxHp) ? 50 : maxHp,
      hp: isNaN(maxHp) ? 50 : maxHp,
      atk: isNaN(atk) ? 12 : atk,
      gold: isNaN(gold) ? 20 : gold,
      sprite: getTag('sprite', '👾'),
      element: getTag('element', 'Physical'),
      weakness: getTag('weakness', 'None'),
      specialMove: getTag('specialMove', 'Brutal Strike'),
      specialAbility,
      expReward: isNaN(expReward) ? 30 : expReward,
      lore: getTag('lore', 'A fierce creature prowling the ancient ruins.'),
      isDefending: false,
    });
  }

  return monsters;
}
