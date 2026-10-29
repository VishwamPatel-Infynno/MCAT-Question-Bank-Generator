/**
 * deduplication.js - Frontend client-side question stem similarity & clustering utility.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'which', 'what', 'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'than', 'so'
]);

export function normalizeStem(text) {
  if (!text) return '';
  // Strip HTML
  let clean = text.replace(/<[^>]+>/g, ' ');
  // Strip LaTeX
  clean = clean.replace(/(\$\$?|\\\(|\\\)|\\\[|\\\])/g, ' ');
  clean = clean.replace(/\\[a-zA-Z]+/g, ' ');
  // Strip non-alphanumeric
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, ' ');
  return clean.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function extractTokens(text) {
  const norm = normalizeStem(text);
  if (!norm) return [];
  return norm.split(' ').filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function computeStemSimilarity(stem1, stem2) {
  const t1 = extractTokens(stem1);
  const t2 = extractTokens(stem2);
  if (t1.length === 0 || t2.length === 0) return 0;

  const s1 = new Set(t1);
  const s2 = new Set(t2);

  let intersection = 0;
  for (const token of s1) {
    if (s2.has(token)) intersection += 1;
  }

  const union = new Set([...s1, ...s2]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  const containment = Math.min(s1.size, s2.size) > 0 ? intersection / Math.min(s1.size, s2.size) : 0;

  return Math.round((0.55 * containment + 0.45 * jaccard) * 100) / 100;
}

export function findDuplicateClusters(questions, threshold = 0.75) {
  const n = questions.length;
  if (n < 2) return [];

  const parent = Array.from({ length: n }, (_, i) => i);
  function find(i) {
    let curr = i;
    while (parent[curr] !== curr) {
      curr = parent[curr];
    }
    return curr;
  }
  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  const pairwiseSims = {};
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const q1 = questions[i];
      const q2 = questions[j];
      const stem1 = q1?.question_stem || '';
      const stem2 = q2?.question_stem || '';
      const sim = computeStemSimilarity(stem1, stem2);
      if (sim >= threshold) {
        union(i, j);
        pairwiseSims[`${Math.min(i, j)}_${Math.max(i, j)}`] = sim;
      }
    }
  }

  const groups = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups[root]) groups[root] = [];
    groups[root].push(i);
  }

  const clusters = [];
  let clusterId = 1;

  for (const members of Object.values(groups)) {
    if (members.length < 2) continue;

    // Pick leader: highest final_score
    const sortedMembers = [...members].sort((a, b) => {
      const sA = questions[a]?.final_score || 0;
      const sB = questions[b]?.final_score || 0;
      return sB - sA;
    });

    const leaderIdx = sortedMembers[0];
    const leader = questions[leaderIdx];

    const duplicates = sortedMembers.slice(1).map((idx) => {
      const pairKey = `${Math.min(leaderIdx, idx)}_${Math.max(leaderIdx, idx)}`;
      const sim = pairwiseSims[pairKey] || computeStemSimilarity(leader?.question_stem, questions[idx]?.question_stem);
      return {
        question: questions[idx],
        similarity_score: sim
      };
    });

    clusters.push({
      cluster_id: `cluster-${clusterId}`,
      size: members.length,
      leader_question: leader,
      duplicates,
      highest_similarity: Math.max(...duplicates.map((d) => d.similarity_score))
    });
    clusterId += 1;
  }

  return clusters.sort((a, b) => b.size - a.size);
}

/**
 * Maps clusters into fast lookup dictionaries for auto-resolution:
 * - duplicateMap: Map<dupQuestionId, { clusterId, leaderQuestion, similarityScore, reason }>
 * - leaderIds: Set<leaderQuestionId>
 * - autoDiscardedIds: Set<dupQuestionId>
 */
export function getAutoResolvedClusterMap(clusters = []) {
  const duplicateMap = new Map();
  const leaderIds = new Set();
  const autoDiscardedIds = new Set();

  for (const cluster of clusters) {
    const leader = cluster.leader_question;
    if (leader?.id) {
      leaderIds.add(leader.id);
    }
    const dups = cluster.duplicates || [];
    for (const d of dups) {
      if (d.question?.id) {
        duplicateMap.set(d.question.id, {
          clusterId: cluster.cluster_id,
          leaderQuestion: leader,
          similarityScore: d.similarity_score || 0,
          reason: d.reason || 'High semantic and lexical overlap with leader question'
        });
        autoDiscardedIds.add(d.question.id);
      }
    }
  }

  return { duplicateMap, leaderIds, autoDiscardedIds };
}

