export const selectTab = (id: string) => {
  document.querySelectorAll<HTMLElement>('#settings .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === id));
  document.querySelectorAll<HTMLElement>('#settings .tpane').forEach(p => p.classList.toggle('on', p.id === id));
};
