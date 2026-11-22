/** Step of a reload. A magazine reload is one `Round` step; a single-load one opens, loads rounds, then closes. */
export enum ReloadPhase {
  Open = 'open',
  Round = 'round',
  Close = 'close',
}
