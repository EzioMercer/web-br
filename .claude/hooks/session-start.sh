#!/usr/bin/env bash
# Runs at the start of every Claude Code session. Only changes anything in cloud sessions:
# cloud containers commit as Claude, sign commits and start on an auto-created claude/* branch.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

git fetch -q origin master 2>/dev/null

# Commit as the repo owner (latest non-Claude author on master), never sign.
author=$(git log --format='%an|%ae' origin/master 2>/dev/null | grep -v 'noreply@anthropic.com' | head -1)

if [ -n "$author" ]; then
  git config user.name "${author%%|*}"
  git config user.email "${author#*|}"
fi

git config commit.gpgsign false
git config tag.gpgsign false

# Leave the auto-created claude/* branch for master, as long as it holds no work of its own.
branch=$(git branch --show-current)

if [[ "$branch" == claude/* ]] && [ -z "$(git status --porcelain)" ] \
  && [ -z "$(git rev-list origin/master..HEAD 2>/dev/null)" ]; then
  git checkout -q master 2>/dev/null && git merge -q --ff-only origin/master 2>/dev/null
fi

echo "Git setup: branch=$(git branch --show-current), author=$(git config user.name), signing=off." \
  "Follow CLAUDE.md: work on master, no attribution, no signing."
exit 0
