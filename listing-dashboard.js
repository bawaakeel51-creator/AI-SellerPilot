'use strict';

const menuToggle = document.getElementById('menu-toggle');
const toolNav = document.getElementById('tool-nav');
const narrowLayout = window.matchMedia('(max-width: 900px)');

function toggleMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  toolNav.classList.toggle('nav-collapsed', !open);
}

toggleMenu(false);
menuToggle.hidden = false;
menuToggle.addEventListener('click', () => {
  toggleMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
toolNav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!narrowLayout.matches || !link) return;
  toggleMenu(false);
  if (link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    menuToggle.focus();
  }
});
toolNav.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !narrowLayout.matches) return;
  toggleMenu(false);
  menuToggle.focus();
});

const search = document.getElementById('tool-search');
const query = document.getElementById('tool-query');
const searchResults = document.getElementById('tool-results');
const searchStatus = document.getElementById('search-status');
const searchLinks = document.getElementById('search-links');
const tools = [...toolNav.querySelectorAll('a')];

function closeSearch() {
  query.value = '';
  updateSearch();
}

function updateSearch() {
  const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = words.length ? tools.filter(link => {
    const name = link.textContent.toLowerCase();
    return words.every(word => name.includes(word));
  }) : [];

  searchResults.hidden = !words.length;
  searchStatus.textContent = !words.length ? '' :
    matches.length ? `${matches.length} matching ${matches.length === 1 ? 'tool' : 'tools'}` : 'No matching tools.';
  searchLinks.replaceChildren();
  for (const link of matches) {
    const item = document.createElement('li');
    const result = link.cloneNode(true);
    result.removeAttribute('class');
    item.append(result);
    searchLinks.append(item);
  }
}

search.hidden = false;
query.addEventListener('input', updateSearch);
search.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target === query) {
    searchLinks.querySelector('a')?.focus();
  }
  if (event.key !== 'Escape') return;
  event.preventDefault();
  closeSearch();
  query.focus();
});
