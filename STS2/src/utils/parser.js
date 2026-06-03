export const parseRunFiles = async (files) => {
  const runs = [];
  
  for (const file of files) {
    if (file.name.endsWith('.backup')) continue;
    if (!file.name.endsWith('.json') && !file.name.endsWith('.run')) continue;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      runs.push(data);
    } catch (e) {
      console.error(`Error parsing ${file.name}:`, e);
    }
  }

  return aggregateData(runs);
};

const aggregateData = (runs) => {
  const stats = {
    totalRuns: runs.length,
    wins: 0,
    losses: 0,
    totalPlaytime: 0,
    characterPlayCounts: {},
    characterPlaytimes: {},
    winRatesByCharacter: {},
    averageFloor: 0,
    totalFloors: 0,
    cardStats: {},
  };

  runs.forEach(run => {
    // Support both STS1 and STS2 schemas
    const isWin = run.win !== undefined ? run.win : (run.victory || run.is_victory);
    if (isWin) {
      stats.wins++;
    } else {
      stats.losses++;
    }

    stats.totalPlaytime += run.run_time || run.playtime || 0;
    
    // Character
    let rawChar = run.character_chosen;
    if (!rawChar && run.players && run.players[0]) {
      rawChar = run.players[0].character;
    }
    const char = (rawChar || 'UNKNOWN').replace('CHARACTER.', '');
    
    const runTime = run.run_time || run.playtime || 0;
    stats.characterPlayCounts[char] = (stats.characterPlayCounts[char] || 0) + 1;
    stats.characterPlaytimes[char] = (stats.characterPlaytimes[char] || 0) + runTime;
    
    if (!stats.winRatesByCharacter[char]) {
      stats.winRatesByCharacter[char] = { wins: 0, total: 0 };
    }
    stats.winRatesByCharacter[char].total++;
    if (isWin) {
      stats.winRatesByCharacter[char].wins++;
    }

    // Floors
    const floorReached = run.floor_reached !== undefined ? run.floor_reached : (run.map_point_history ? run.map_point_history.length : 0);
    stats.totalFloors += floorReached;
    
    // Deck
    let deck = run.master_deck;
    if (!deck && run.players && run.players[0] && run.players[0].deck) {
      deck = run.players[0].deck.map(c => c.id);
    }

    if (deck) {
      const IGNORED_CARDS = [
        'STRIKE_IRONCLAD', 'DEFEND_IRONCLAD', 'STRIKE_R', 'DEFEND_R', 'BASH',
        'STRIKE_SILENT', 'DEFEND_SILENT', 'STRIKE_G', 'DEFEND_G', 'NEUTRALIZE', 'SURVIVOR',
        'STRIKE_DEFECT', 'DEFEND_DEFECT', 'STRIKE_B', 'DEFEND_B', 'ZAP', 'DUALCAST',
        'STRIKE_NECROBINDER', 'DEFEND_NECROBINDER', 'BODYGUARD', 'UNLEASH',
        'STRIKE_REGENT', 'DEFEND_REGENT', 'VENERATE', 'SOVEREIGN_BLADE', 'FALLING_STAR',
        'ASCENDERS_BANE'
      ];

      deck.forEach(card => {
        // Strip upgrades and CARD. prefix
        let baseCard = card.split('+')[0].replace('CARD.', '');
        if (!IGNORED_CARDS.includes(baseCard)) {
          if (!stats.cardStats[baseCard]) {
            stats.cardStats[baseCard] = { count: 0, wins: 0 };
          }
          stats.cardStats[baseCard].count++;
          if (isWin) {
            stats.cardStats[baseCard].wins++;
          }
        }
      });
    }
  });

  stats.averageFloor = stats.totalRuns > 0 ? Math.round(stats.totalFloors / stats.totalRuns) : 0;
  
  // Format character win rates
  for (const char in stats.winRatesByCharacter) {
    const data = stats.winRatesByCharacter[char];
    data.rate = data.total > 0 ? (data.wins / data.total) * 100 : 0;
  }

  // Sort top cards by picks
  stats.topCards = Object.entries(stats.cardStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({ name, count: data.count }));

  // Sort top cards by winrate (require min 3 picks)
  stats.topCardsByWinrate = Object.entries(stats.cardStats)
    .filter(([name, data]) => data.count >= 3)
    .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count) || b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({ name, winrate: parseFloat(((data.wins / data.count) * 100).toFixed(1)) }));

  return { runs, stats };
};
