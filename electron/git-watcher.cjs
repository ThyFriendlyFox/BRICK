/**
 * BRICK Git Watcher
 *
 * Watches a local git repository for new commits by polling `git log`.
 * When new commits are detected, emits events with commit message + diff
 * so BRICK can use them as context for draft generation.
 *
 * Runs in the Electron main process.
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── State ───────────────────────────────────────────────────────────────────

/** @type {{ repoPath: string, lastCommitHash: string | null, pollInterval: ReturnType<typeof setInterval> | null } | null} */
let watchState = null;

/** @type {Set<(event: object) => void>} */
const commitListeners = new Set();

/** @type {object[]} */
const commitLog = [];

const POLL_INTERVAL_MS = 5000; // Check every 5 seconds

// ─── Git Helpers ─────────────────────────────────────────────────────────────

/**
 * Run a git command in a repo directory.
 * @param {string} repoPath
 * @param {string[]} args
 * @returns {Promise<string>}
 */
function gitExec(repoPath, args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repoPath, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Check if a directory is a valid git repository.
 * @param {string} dirPath
 * @returns {Promise<boolean>}
 */
async function isGitRepo(dirPath) {
  try {
    await gitExec(dirPath, ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the repo root from any subdirectory.
 * @param {string} dirPath
 * @returns {Promise<string>}
 */
async function getRepoRoot(dirPath) {
  return gitExec(dirPath, ['rev-parse', '--show-toplevel']);
}

/**
 * Get the current branch name.
 * @param {string} repoPath
 * @returns {Promise<string>}
 */
async function getCurrentBranch(repoPath) {
  try {
    return await gitExec(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch {
    return 'unknown';
  }
}

/**
 * Get the latest commit hash.
 * @param {string} repoPath
 * @returns {Promise<string|null>}
 */
async function getLatestCommitHash(repoPath) {
  try {
    return await gitExec(repoPath, ['rev-parse', 'HEAD']);
  } catch {
    return null;
  }
}

/**
 * Get recent commits with details.
 * @param {string} repoPath
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function getRecentCommits(repoPath, limit = 10) {
  try {
    // Format: hash|author|date|subject
    const SEPARATOR = '|||';
    const RECORD_SEP = '<<<COMMIT>>>';
    const format = `${RECORD_SEP}%H${SEPARATOR}%an${SEPARATOR}%ai${SEPARATOR}%s`;
    const output = await gitExec(repoPath, ['log', `-${limit}`, `--format=${format}`]);

    if (!output) return [];

    return output
      .split(RECORD_SEP)
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, subject] = line.trim().split(SEPARATOR);
        return { hash, author, date, subject };
      });
  } catch {
    return [];
  }
}

/**
 * Get the diff for a specific commit (compared to its parent).
 * @param {string} repoPath
 * @param {string} commitHash
 * @returns {Promise<string>}
 */
async function getCommitDiff(repoPath, commitHash) {
  try {
    // --stat gives a summary, then full diff (truncated for large diffs)
    const stat = await gitExec(repoPath, ['diff', '--stat', `${commitHash}~1`, commitHash]);
    const diff = await gitExec(repoPath, [
      'diff',
      '--no-color',
      '-U3',             // 3 lines of context
      '--diff-filter=ACMR', // Added, Copied, Modified, Renamed only
      `${commitHash}~1`,
      commitHash,
    ]);

    // Truncate very long diffs
    const maxLen = 5000;
    const truncatedDiff = diff.length > maxLen ? diff.slice(0, maxLen) + '\n... (diff truncated)' : diff;

    return `${stat}\n\n${truncatedDiff}`;
  } catch {
    // First commit in repo has no parent
    try {
      const stat = await gitExec(repoPath, ['diff', '--stat', '--root', commitHash]);
      return stat;
    } catch {
      return '(unable to get diff)';
    }
  }
}

/**
 * Get new commits since a given hash.
 * @param {string} repoPath
 * @param {string} sinceHash
 * @returns {Promise<object[]>}
 */
async function getNewCommitsSince(repoPath, sinceHash) {
  try {
    const SEPARATOR = '|||';
    const RECORD_SEP = '<<<COMMIT>>>';
    const format = `${RECORD_SEP}%H${SEPARATOR}%an${SEPARATOR}%ai${SEPARATOR}%s`;
    const output = await gitExec(repoPath, ['log', `${sinceHash}..HEAD`, `--format=${format}`]);

    if (!output) return [];

    return output
      .split(RECORD_SEP)
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, subject] = line.trim().split(SEPARATOR);
        return { hash, author, date, subject };
      });
  } catch {
    return [];
  }
}

// ─── Polling ─────────────────────────────────────────────────────────────────

async function pollForCommits() {
  if (!watchState) return;

  try {
    const currentHash = await getLatestCommitHash(watchState.repoPath);
    if (!currentHash) return;

    if (watchState.lastCommitHash && currentHash !== watchState.lastCommitHash) {
      // New commit(s) detected
      const newCommits = await getNewCommitsSince(watchState.repoPath, watchState.lastCommitHash);

      for (const commit of newCommits.reverse()) {
        // Get diff for each new commit
        const diff = await getCommitDiff(watchState.repoPath, commit.hash);
        const branch = await getCurrentBranch(watchState.repoPath);

        const event = {
          type: 'git_commit',
          repoPath: watchState.repoPath,
          branch,
          commit: {
            hash: commit.hash,
            author: commit.author,
            date: commit.date,
            message: commit.subject,
          },
          diff,
          timestamp: new Date().toISOString(),
        };

        commitLog.push(event);

        // Notify listeners
        for (const listener of commitListeners) {
          try {
            listener(event);
          } catch (err) {
            console.error('[Git] Error in commit listener:', err);
          }
        }
      }
    }

    watchState.lastCommitHash = currentHash;
  } catch (err) {
    console.error('[Git] Polling error:', err.message);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate that a path is a git repository.
 * @param {string} dirPath
 * @returns {Promise<{ valid: boolean, repoRoot?: string, branch?: string, error?: string }>}
 */
async function validateRepo(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return { valid: false, error: 'Directory does not exist' };
    }

    const isRepo = await isGitRepo(dirPath);
    if (!isRepo) {
      return { valid: false, error: 'Not a git repository' };
    }

    const repoRoot = await getRepoRoot(dirPath);
    const branch = await getCurrentBranch(repoRoot);

    return { valid: true, repoRoot, branch };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Start watching a git repo for new commits.
 * @param {string} repoPath - Path to the git repo
 * @returns {Promise<{ success: boolean, repoPath?: string, branch?: string, error?: string }>}
 */
async function startWatching(repoPath) {
  try {
    // Stop any existing watcher
    await stopWatching();

    // Validate the repo
    const validation = await validateRepo(repoPath);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const rootPath = validation.repoRoot || repoPath;
    const latestHash = await getLatestCommitHash(rootPath);

    watchState = {
      repoPath: rootPath,
      lastCommitHash: latestHash,
      pollInterval: setInterval(pollForCommits, POLL_INTERVAL_MS),
    };

    console.log(`[Git] Watching repo: ${rootPath} (branch: ${validation.branch}, head: ${latestHash?.slice(0, 8)})`);

    return {
      success: true,
      repoPath: rootPath,
      branch: validation.branch,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Stop watching the current repo.
 * @returns {Promise<void>}
 */
async function stopWatching() {
  if (watchState) {
    if (watchState.pollInterval) {
      clearInterval(watchState.pollInterval);
    }
    console.log(`[Git] Stopped watching: ${watchState.repoPath}`);
    watchState = null;
  }
}

/**
 * Get the current watcher status.
 * @returns {Promise<{ watching: boolean, repoPath: string | null, branch: string | null, totalCommits: number }>}
 */
async function getStatus() {
  if (!watchState) {
    return { watching: false, repoPath: null, branch: null, totalCommits: commitLog.length };
  }

  const branch = await getCurrentBranch(watchState.repoPath).catch(() => 'unknown');
  return {
    watching: true,
    repoPath: watchState.repoPath,
    branch,
    totalCommits: commitLog.length,
  };
}

/**
 * Get recent commits from the watched repo (for display, not just new ones).
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function fetchRecentCommits(limit = 10) {
  if (!watchState) return [];
  return getRecentCommits(watchState.repoPath, limit);
}

/**
 * Get the commit event log (commits detected since watching started).
 * @returns {object[]}
 */
function getCommitLog() {
  return [...commitLog];
}

/**
 * Register a listener for new commit events.
 * @param {(event: object) => void} callback
 * @returns {() => void} Unsubscribe function
 */
function onCommit(callback) {
  commitListeners.add(callback);
  return () => commitListeners.delete(callback);
}

module.exports = {
  validateRepo,
  startWatching,
  stopWatching,
  getStatus,
  fetchRecentCommits,
  getCommitLog,
  onCommit,
};
