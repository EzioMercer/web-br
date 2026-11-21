#!/usr/bin/env bash
# Blocks Claude from creating branches, signing commits or adding attribution trailers.
# To allow a new branch, run the command yourself or remove this hook temporarily.

input=$(cat)
tool=$(jq -r '.tool_name // ""' <<<"$input")

block() {
  echo "Blocked by .claude/hooks/guard-git.sh: $1. See CLAUDE.md." >&2
  exit 2
}

case "$tool" in
  mcp__github__create_branch | EnterWorktree) block "no new branches unless the owner asks" ;;
esac

cmd=$(jq -r '.tool_input.command // ""' <<<"$input")

grep -Eq 'git +(checkout|switch) +[^|;&]*(-b|-B|-c|-C|--create|--orphan)( |$)|git +branch +[^-| ]|git +worktree +add' \
  <<<"$cmd" && block "no new branches unless the owner asks"
grep -Eqi 'co-authored-by|claude-session:|generated with \[?claude' <<<"$cmd" && block "no Claude attribution"
grep -Eq -- '--gpg-sign|git +(commit|tag)[^|;&]* -[a-zA-Z]*[sS]( |$)|gpgsign=true' <<<"$cmd" && block "no signing"
grep -Eq 'git +push[^|;&]*claude/' <<<"$cmd" && block "push to master only"
exit 0
